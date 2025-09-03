import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Utils } from 'src/_common/utils/utils';
import moment from 'moment';
import { addDays } from 'date-fns';

@Injectable()
export class FirmaSeguraService {
	private readonly logger = new Logger(FirmaSeguraService.name);
	private readonly apiToken = process.env.FIRMA_SEGURA_TOKEN?.trim();
	private readonly urlFirmaSegura = process.env.URL_FIRMA_SEGURA?.trim();

	constructor(
		private prisma: PrismaService,
		private httpService: HttpService
	) {}

	async registerApplication(data: any) {
		try {
			const response$ = this.httpService.post(`${this.urlFirmaSegura}/collector/request`, data, { headers: { Authorization: `Bearer ${this.apiToken}` } });

			const response = await firstValueFrom(response$);

			return {
				status: response.status,
				data: response.data || null,
			};
		} catch (error: any) {
			return {
				status: error.response?.status || null,
				data: error.response?.data || null,
				message: error.message,
				isAxiosError: error.isAxiosError || false,
			};
		}
	}

	async resendAplication(id: number) {
		const app = await this.prisma.application.findUnique({ where: { id } });
		if (!app) {
			return Utils.formatResponseFail('La solicitud asociada no existe');
		}
		const plan = await this.prisma.plan.findUnique({ where: { id: app.planId } });
		if (!plan) {
			return Utils.formatResponseFail('El plan asociado a la solicitud no existe');
		}

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
			firmaResponse = await this.registerApplication({
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
							approvedById: 1,
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
							approvedById: 1,
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
			// console.log(firmaResponse);
			await this.prisma.application.update({
				where: { id: app.id },
				data: {
					externalStatus: 'error',
					observation: `Error al registrar en FirmaSegura: ${firmaResponse?.data?.message || 'desconocido'}`,
					lastCheckedAt: new Date(),
					approvedById: 1,
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

	async checkApplicationStatus(referenceTransaction: string) {
		const response$ = this.httpService.get(`${this.urlFirmaSegura}/gateway/request/status`, {
			headers: { Authorization: `Bearer ${this.apiToken}` },
			params: { referenceTransaction },
		});

		const response = await firstValueFrom(response$);
		return response.data;
	}

	@Cron(CronExpression.EVERY_5_MINUTES)
	async updateApplicationsStatus() {
		const applications = await this.prisma.application.findMany({
			where: {
				externalStatus: {
					in: ['pending', 'REGISTERED', 'VALIDATING', 'REFUSED', 'ERROR', 'APPROVED', 'EXPIRED'],
				},
				payment: {
					status: 'aprobado',
				},
			},
		});

		for (const app of applications) {
			try {
				const statusResponse = await this.checkApplicationStatus(app.referenceTransaction);
				if (statusResponse.status !== app.externalStatus) {
					const newObservationEntry = `${statusResponse.status} - ${statusResponse.updatedDate}`;

					await this.prisma.application.update({
						where: { id: app.id },
						data: {
							externalStatus: statusResponse.status,
							observation: app.observation ? `${app.observation}\n${newObservationEntry}` : newObservationEntry,
							lastCheckedAt: new Date(),
						},
					});

					this.logger.log(`Solicitud ${app.referenceTransaction} actualizada a ${statusResponse.status} - ${statusResponse.observation.message}`);
				} else {
					// 👇 Si no cambió, solo actualiza la fecha de verificación
					await this.prisma.application.update({
						where: { id: app.id },
						data: {
							lastCheckedAt: new Date(),
						},
					});

					this.logger.log(`Solicitud ${app.referenceTransaction} sin cambios de estado (${statusResponse.status} - ${statusResponse.observation})`);
				}
			} catch (error) {
				this.logger.error(`Error actualizando solicitud ${app.referenceTransaction}: ${error}`);
			}
		}
	}
}
