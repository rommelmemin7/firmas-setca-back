import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Utils } from 'src/_common/utils/utils';
import { FirmaSeguraService } from 'src/firma-segura/firma-segura.service';
import { addDays } from 'date-fns';
import { buffer, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as request from 'supertest';
import { parse } from 'path';
import moment from 'moment';
import { ApplicationService } from 'src/application/application.service';
import { PaymentGateway } from './payment.gateway';

@Injectable()
export class PaymentService {
	private readonly apiUrl = process.env['URL_SOLICITUD_DEUNA'];
	private readonly apiUrlEstatus = process.env['URL_ESTATUS_DEUNA'];
	private readonly apiUrlCancel = process.env['URL_CANCELACION_DEUNA'];
	private readonly apiUrlPayphoneStatus = process.env['URL_PAYPHONE_STATUS'];
	constructor(
		private prisma: PrismaService,
		private readonly httpService: HttpService,
		private firmaSeguraService: FirmaSeguraService,
		@Inject(forwardRef(() => ApplicationService))
		private readonly appService: ApplicationService,
		private readonly paymentGateway: PaymentGateway
	) {}

	async createPayment(data: CreatePaymentDto) {
		const appExists = await this.prisma.application.findUnique({
			where: { id: data.applicationId },
		});

		if (!appExists) {
			return Utils.formatResponseFail('La solicitud no existe');
		}

		const existingPayment = await this.prisma.payment.findUnique({
			where: { applicationId: data.applicationId },
		});

		if (existingPayment) {
			return Utils.formatResponseFail('Ya existe un pago para esta solicitud');
		}

		let comprobanteBuffer: Buffer | null = null;

		// Validar según tipo de pago
		if (data.tipoPago !== 'Deuna' && data.tipoPago !== 'Payphone') {
			if (!data.comprobanteImageBase64 || data.comprobanteImageBase64.trim() === '') {
				return Utils.formatResponseFail('El comprobante es obligatorio para este tipo de pago');
			}
		}

		// Si hay imagen, convertir a Buffer
		if (data.comprobanteImageBase64 && data.comprobanteImageBase64.trim() !== '') {
			try {
				comprobanteBuffer = Buffer.from(data.comprobanteImageBase64, 'base64');
			} catch (error) {
				return Utils.formatResponseFail('Formato de imagen inválido');
			}
		}

		const payment = await this.prisma.payment.create({
			data: {
				applicationId: data.applicationId,
				comprobanteNumber: data.comprobanteNumber,
				tipoPago: data.tipoPago ? data.tipoPago.toUpperCase() : 'TRANSFERENCIA',
				comprobanteImage: comprobanteBuffer, //
			},
		});

		return Utils.formatResponseSuccess('Pago creado exitosamente', Utils.formatDates(payment));
	}

	async updateStatus(id: number, data: UpdatePaymentStatusDto) {
		const payment = await this.prisma.payment.findUnique({ where: { id } });
		if (!payment) {
			return Utils.formatResponseFail('Pago no encontrado');
		}

		const app = await this.prisma.application.findUnique({ where: { id: payment.applicationId } });
		if (!app) {
			return Utils.formatResponseFail('La solicitud asociada no existe');
		}

		if (payment.status === 'aprobado' && data.status === 'aprobado' && app.status === 'aprobado') {
			return Utils.formatResponseFail('El pago y la solicitud ya han sido aprobadas');
		}

		const plan = await this.prisma.plan.findUnique({ where: { id: app.planId } });
		if (!plan) {
			return Utils.formatResponseFail('El plan asociado a la solicitud no existe');
		}

		await this.prisma.payment.update({
			where: { id },
			data: {
				status: data.status,
				approvedAt: data.status === 'aprobado' || data.status === 'rechazado' ? new Date() : null,
			},
		});

		// Preparamos los bytes de los documentos
		const frontBytes = Array.from(app.identificationFront);
		const backBytes = Array.from(app.identificationBack);
		const selfieBytes = Array.from(app.identificationSelfie);
		const video = app.authorizationVideo ? Array.from(app.authorizationVideo) : null;
		const pdfCompanyRuc = app.pdfCompanyRuc ? Array.from(app.pdfCompanyRuc) : null;
		const pdfRepresentativeAppointment = app.pdfRepresentativeAppointment ? Array.from(app.pdfRepresentativeAppointment) : null;
		const pdfAppointmentAcceptance = app.pdfAppointmentAcceptance ? Array.from(app.pdfAppointmentAcceptance) : null;
		const pdfCompanyConstitution = app.pdfCompanyConstitution ? Array.from(app.pdfCompanyConstitution) : null;

		console.log('Bytes preparados para FirmaSegura:', {
			frontLength: frontBytes.length,
			backLength: backBytes.length,
			selfieLength: selfieBytes.length,
		});

		let firmaResponse;
		try {
			// Llamada a FirmaSegura
			firmaResponse = await this.firmaSeguraService.registerApplication({
				identificationNumber: app.identificationNumber,
				applicantName: app.applicantName,
				applicantLastName: app.applicantLastName,
				applicantSecondLastName: app.applicantSecondLastName,
				fingerCode: app.fingerCode,
				emailAddress: app.emailAddress,
				cellphoneNumber: app.cellphoneNumber,
				city: app.city,
				province: app.province,
				address: app.address,
				countryCode: app.countryCode,
				companyRuc: app.companyRuc,
				positionCompany: app.positionCompany,
				companySocialReason: app.companySocialReason,
				appointmentExpirationDate: app.appointmentExpirationDate ? moment(app.appointmentExpirationDate).format('YYYY-MM-DD HH:mm:ss') : null,
				applicationType: app.applicationType,
				documentType: app.documentType,
				referenceTransaction: app.referenceTransaction,
				period: app.period!,
				identificationFront: frontBytes,
				identificationBack: backBytes,
				identificationSelfie: selfieBytes,
				pdfCompanyRuc: pdfCompanyRuc,
				pdfRepresentativeAppointment: pdfRepresentativeAppointment,
				pdfAppointmentAcceptance: pdfAppointmentAcceptance,
				pdfCompanyConstitution: pdfCompanyConstitution,
				authorizationVideo: video,
			});

			console.log('✅ FirmaSegura respondió correctamente:', JSON.stringify(firmaResponse, null, 2));
		} catch (error: any) {
			console.error('❌ Error al llamar a FirmaSegura:', {
				message: error.message,
				isAxiosError: error.isAxiosError,
				config: error.config,
				responseStatus: error.response?.status,
				responseHeaders: error.response?.headers,
				responseData: error.response?.data,
			});

			return Utils.formatResponseFail(`Error inesperado en FirmaSegura: ${error.message || 'desconocido'}`);
		}

		console.log('Código de estado HTTP:', firmaResponse?.status);
		console.log('Headers de respuesta:', JSON.stringify(firmaResponse?.headers, null, 2));
		console.log('Cuerpo de la respuesta:', JSON.stringify(firmaResponse?.data, null, 2));

		if (firmaResponse.status == 200) {
			try {
				await this.prisma.$transaction(async (tx) => {
					const client = await tx.client.create({
						data: {
							identificationNumber: app.identificationNumber,
							applicantName: app.applicantName,
							applicantLastName: app.applicantLastName,
							applicantSecondLastName: app.applicantSecondLastName,
							emailAddress: app.emailAddress,
							cellphoneNumber: app.cellphoneNumber,
							applicationId: app.id,
							approvedById: data.adminUserId,
						},
					});

					const startDate = new Date();
					const endDate = addDays(startDate, plan.durationdays);
					await tx.subscription.create({
						data: {
							clientId: client.id,
							planId: plan.id,
							startDate,
							endDate,
						},
					});

					await tx.application.update({
						where: { id: app.id },
						data: {
							externalStatus: 'pending',
							lastCheckedAt: new Date(),
							approvedById: data.adminUserId,
							status: 'aprobado',
							approvedAt: new Date(),
						},
						select: {
							id: true,
							approvedBy: { select: { id: true, name: true, email: true } },
						},
					});
				});

				return Utils.formatResponseSuccess('Estado del pago actualizado y solicitud registrada exitosamente');
			} catch (error) {
				console.error('Error en la transacción Prisma:', error);
				return Utils.formatResponseFail('Error' + (error.message || 'desconocido'));
			}
		} else {
			await this.prisma.application.update({
				where: { id: app.id },
				data: {
					externalStatus: 'error',
					observation: `Error al registrar en FirmaSegura: ${firmaResponse?.data?.message || 'desconocido'}`,
					lastCheckedAt: new Date(),
					approvedById: data.adminUserId,
					status: 'registrado - no enviado',
					approvedAt: new Date(),
				},
				select: {
					id: true,
					approvedBy: { select: { id: true, name: true, email: true } },
				},
			});
			return Utils.formatResponseFail(`Error al registrar la solicitud en FirmaSegura: ${firmaResponse?.data?.message || 'desconocido'}`);
		}
	}

	async getPaymentByApplication(applicationId: number) {
		const payment = await this.prisma.payment.findUnique({
			where: { applicationId },
		});

		if (!payment) {
			return Utils.formatResponseFail('Pago no encontrado');
		}

		return Utils.formatResponseSuccess('Pago encontrado', Utils.formatDates(payment));
	}

	async getPaymentIdComprobante(referenceTransaction: string) {
		const payment = await this.prisma.payment.findFirst({
			where: { comprobanteNumber: referenceTransaction },
		});

		if (!payment) {
			return Utils.formatResponseFail('Pago no encontrado');
		}

		return Utils.formatResponseSuccess('Pago encontrado', Utils.formatDates(payment));
	}

	async requestPaymentPayphone(idSolicitud: number) {
		try {
			const app = await this.prisma.application.findUnique({
				where: { id: idSolicitud },
				select: {
					id: true,
					referenceTransaction: true,
					plan: true,
					applicantName: true,
					planId: true,
					emailAddress: true,
					cellphoneNumber: true,
				},
			});

			if (!app) {
				return Utils.formatResponseFail('La solicitud asociada no existe');
			}

			const plan = await this.prisma.plan.findUnique({
				where: { id: app.planId },
			});

			if (!plan) {
				return Utils.formatResponseFail('El plan asociado a la solicitud no existe');
			}

			await this.createPayment({
				applicationId: app.id,
				comprobanteNumber: 'Payphone-' + app.referenceTransaction,
				comprobanteImageBase64: '',
				tipoPago: 'Payphone',
			});

			return Utils.formatResponseSuccess('Solicitud de pago Payphone creada exitosamente', { app, iva: process.env.IVA || '0' });
		} catch (e) {
			return Utils.formatResponseFail('Error al enviar solicitud de pago Payphone' + e.message);
		}
	}
	async getPaymentStatusPayphone(transactionId: string, clientTransactionId: string) {
		const headers = {
			Authorization: `Bearer ${process.env.TOKEN_PAYPHONE}`,
			'Content-Type': 'application/json',
		};

		const body = {
			id: Number(transactionId),
			clientTxId: clientTransactionId,
		};
		const response$ = this.httpService.post(this.apiUrlPayphoneStatus!, body, { headers });

		try {
			const response = await firstValueFrom(response$);
			console.log('Respuesta Payphone:', response.data);

			if (response.data.transactionStatus === 'Approved') {
				try {
					const app = await this.appService.getApplicationByIntRef(response.data.clientTransactionId);

					if (!app) {
						return Utils.formatResponseFail('Solicitud no encontrada');
					}

					if (app.data.payment.status !== 'aprobado') {
						const res = await this.updateStatus(app.data.payment.id, {
							status: response.data.transactionStatus === 'Approved' ? 'aprobado' : 'rechazado',
							adminUserId: 1,
						});
					} else {
						console.log('Solicitud aprobada previamente');
						return Utils.formatResponseSuccess('Solicitud aprobada previamente', response.data);
					}
				} catch (error) {
					console.error('Error procesando respuesta Payphone:', error);
					return Utils.formatResponseFail('Error interno al procesar la solicitud');
				}
				return Utils.formatResponseSuccess('Consulta de pago Payphone exitosa', response.data);
			}
		} catch (error) {
			return Utils.formatResponseFail('Error al consultar estado del pago Payphone: ' + error.message);
		}
	}
	//deuna
	async requestPaymentDeuna(idSolicitud: number) {
		try {
			const apiKey = process.env['X-API-KEY'];
			const apiSecret = process.env['X-API-SECRET'];

			const app = await this.prisma.application.findUnique({
				where: { id: idSolicitud },
			});

			if (!app) {
				return Utils.formatResponseFail('La solicitud asociada no existe');
			}

			const plan = await this.prisma.plan.findUnique({
				where: { id: app.planId },
			});
			if (!plan) {
				return Utils.formatResponseFail('El plan asociado a la solicitud no existe');
			}

			await this.createPayment({
				applicationId: app.id,
				comprobanteNumber: 'DeUna-' + app.referenceTransaction,
				comprobanteImageBase64: '',
				tipoPago: 'Deuna',
			});

			const headers = {
				'x-api-key': apiKey,
				'x-api-secret': apiSecret,
			};

			const body = {
				pointOfSale: process.env['ID-CAJA'],
				qrType: 'dynamic',
				amount: Utils.calculateTotalWithIVA(plan.price, parseFloat(process.env.IVA || '0')),
				detail: 'Pago firma plan: ' + plan.description + ' - ' + app.applicantName,
				internalTransactionReference: app.referenceTransaction,
				format: '2',
			};

			const response$ = this.httpService.post(this.apiUrl!, body, { headers });

			const response = await firstValueFrom(response$);

			return Utils.formatResponseSuccess('Solicitud de pago deUna enviado exitosamente', response.data);
		} catch (error) {
			return Utils.formatResponseFail('Error al enviar solicitud de pago deUna: ' + error.message);
		}
	}

	async getPaymentStatusDeuna(transaccionId: string) {
		const apiKey = process.env['X-API-KEY'];
		const apiSecret = process.env['X-API-SECRET'];
		try {
			const headers = {
				'x-api-key': apiKey,
				'x-api-secret': apiSecret,
			};

			const body = {
				idTransacionReference: transaccionId,
				idType: '0',
			};

			const response$ = this.httpService.post(this.apiUrlEstatus!, body, {
				headers,
			});

			const response = await firstValueFrom(response$);
			const data = response.data;

			if (!response.data?.status || response.data?.idTransaction) {
				Utils.formatResponseFail('Consulta de deuna fallida: respuesta inválida');
			}

			if (data.status === 'SUCCESS') {
				try {
					const app = await this.appService.getApplicationByIntRef(data.internalTransactionReference);

					if (!app) {
						return Utils.formatResponseFail('Solicitud no encontrada');
					}

					console.log(app.data);
					if (app.data.payment.status !== 'aprobado') {
						await this.updateStatus(app.data.payment.id, {
							status: data.status == 'SUCCESS' ? 'aprobado' : 'rechazado',
							adminUserId: 1,
						});
						this.paymentGateway.sendPaymentUpdate(app.data.referenceTransaction, {
							reference: data.internalTransactionReference,
							status: data.status,
							amount: data.amount,
							customerId: data.customerIdentification,
							currency: data.currency,
							date: data.date,
							description: data.description,
						});
					} else {
						console.log('Solicitud aprobada previamente');
					}
					return Utils.formatResponseSuccess('Consulta de pago exitosa', response.data);
				} catch (error) {
					console.error('Error procesando webhook:', error);
					return Utils.formatResponseFail('Error interno al procesar la solicitud');
				}
			}

			return Utils.formatResponseSuccess('Consulta de pago exitosa', response.data);
		} catch (error) {
			return Utils.formatResponseFail('Error al consultar estado del pago: ' + error.message);
		}
	}

	async anularPaymentDeuna(transaccionId: string) {
		const apiKey = process.env['X-API-KEY'];
		const apiSecret = process.env['X-API-SECRET'];

		try {
			const headers = {
				'x-api-key': apiKey,
				'x-api-secret': apiSecret,
			};

			const body = {
				transactionId: transaccionId,
				pointOfSale: process.env['ID-CAJA'],
			};

			const response$ = this.httpService.post(this.apiUrlCancel!, body, {
				headers,
			});

			const response = await firstValueFrom(response$);
			return Utils.formatResponseSuccess('Anulación de pago exitosa', response.data);
		} catch (error) {
			return Utils.formatResponseFail('Error al anular solicitud de pago: ' + error.message);
		}
	}
}
