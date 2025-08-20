import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Asumo tienes este servicio
import { CreateApplicationDto } from './dto/create-application.dto';
import { Utils } from 'src/_common/utils/utils';
import { FilterApplicationsDto } from './dto/filtro-fecha-id.dto';
import { endOfDay, startOfDay } from 'date-fns';
import { PaymentService } from 'src/payment/payment.service';

@Injectable()
export class ApplicationService {
	constructor(
		private readonly prisma: PrismaService,
		private payment: PaymentService
	) {}

	async createApplication(dto: CreateApplicationDto) {
		const plan = await this.prisma.plan.findUnique({
			where: { id: dto.planId },
		});
		if (!plan) {
			throw new BadRequestException('El plan especificado no existe');
		}
		try {
			const app = await this.prisma.application.create({
				data: {
					status: 'pending',
					planId: dto.planId,
					identificationNumber: dto.identificationNumber,
					applicantName: dto.applicantName,
					applicantLastName: dto.applicantLastName,
					applicantSecondLastName: dto.applicantSecondLastName,
					fingerCode: dto.fingerCode,
					emailAddress: dto.emailAddress,
					cellphoneNumber: dto.cellphoneNumber,
					city: dto.city,
					province: dto.province,
					address: dto.address,
					countryCode: dto.countryCode,
					companyRuc: dto.companyRuc,
					positionCompany: dto.positionCompany,
					companySocialReason: dto.companySocialReason,
					appointmentExpirationDate: dto.appointmentExpirationDate ? new Date(dto.appointmentExpirationDate) : null,
					applicationType: dto.applicationType,
					documentType: dto.documentType,
					referenceTransaction: Utils.generateReferenceTransaction('REF-TX'),
					period: plan.period!,
					identificationFront: Buffer.from(dto.identificationFront, 'base64'),
					identificationBack: Buffer.from(dto.identificationBack, 'base64'),
					identificationSelfie: Buffer.from(dto.identificationSelfie, 'base64'),
					pdfCompanyRuc: dto.pdfCompanyRuc ? Buffer.from(dto.pdfCompanyRuc, 'base64') : null,
					pdfRepresentativeAppointment: dto.pdfRepresentativeAppointment ? Buffer.from(dto.pdfRepresentativeAppointment, 'base64') : null,
					pdfAppointmentAcceptance: dto.pdfAppointmentAcceptance ? Buffer.from(dto.pdfAppointmentAcceptance, 'base64') : null,
					pdfCompanyConstitution: dto.pdfCompanyConstitution ? Buffer.from(dto.pdfCompanyConstitution, 'base64') : null,
					authorizationVideo: dto.authorizationVideo ? Buffer.from(dto.authorizationVideo, 'base64') : null,
					createdAt: new Date(),
					idCreador: dto.idCreador,

					// approvedById se deja null al crear
				},
			});

			if (app.idCreador == null) {
				try {
					const response = await this.payment.requestPaymentDeuna(app.id);

					return Utils.formatResponseSuccess('Solicitud creada exitosamente', response.data);
				} catch (error) {
					Utils.formatResponseFail('Error al enviar solicitud de pago deUna: ' + error.message);
				}
			} else {
				return Utils.formatResponseSuccess('Solicitud creada exitosamente', Utils.formatDates(app));
			}
		} catch (error) {
			throw new BadRequestException('Error creando la solicitud: ' + error.message);
		}
	}

	async getAllApplications(role: number, idUser: number) {
		const app = await this.prisma.application.findMany({
			orderBy: { createdAt: 'desc' },
			where: role == 1 ? {} : { idCreador: idUser },
			select: {
				id: true,
				identificationNumber: true,
				applicantName: true,
				applicantSecondLastName: true,
				applicantLastName: true,
				emailAddress: true,
				status: true,
				createdAt: true,
				updatedAt: true,
				approvedAt: true,
				payment: {
					select: {
						id: true,
						tipoPago: true,
						status: true,
						createdAt: true,
						updatedAt: true,
						approvedAt: true,
					},
				},
				// relación con approvedBy
				approvedBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		const resp = app.map((a) => ({
			...a,
			createdAt: a.createdAt.toISOString(),
			updatedAt: a.updatedAt.toISOString(),
			approvedAt: a.approvedAt ? a.approvedAt.toISOString() : null,
			payment: a.payment
				? {
						...a.payment,
						createdAt: a.payment.createdAt.toISOString(),
						updatedAt: a.payment.updatedAt.toISOString(),
						approvedAt: a.payment.approvedAt ? a.payment.approvedAt.toISOString() : null,
					}
				: null,
		}));

		return Utils.formatResponseSuccess('Solicitudes obtenidas exitosamente', resp);
	}

	async getApplicationsPaymentAprobate(role: number, idUser: number) {
		const app = await this.prisma.application.findMany({
			where: {
				payment: {
					status: 'aprobado',
				},
				...(role == 1 ? {} : { idCreador: idUser }),
			},
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				identificationNumber: true,
				applicantName: true,
				applicantSecondLastName: true,
				applicantLastName: true,
				emailAddress: true,
				status: true,
				createdAt: true,
				updatedAt: true,
				approvedAt: true,
				externalStatus: true,
				observation: true,
				payment: {
					select: {
						id: true,
						tipoPago: true,
						status: true,
						createdAt: true,
						updatedAt: true,
						approvedAt: true,
					},
				},
				approvedBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		const resp = app.map((a) => ({
			...a,
			createdAt: a.createdAt.toISOString(),
			updatedAt: a.updatedAt.toISOString(),
			approvedAt: a.approvedAt ? a.approvedAt.toISOString() : null,
			payment: a.payment
				? {
						...a.payment,
						createdAt: a.payment.createdAt.toISOString(),
						updatedAt: a.payment.updatedAt.toISOString(),
						approvedAt: a.payment.approvedAt ? a.payment.approvedAt.toISOString() : null,
					}
				: null,
		}));

		return Utils.formatResponseSuccess('Solicitudes obtenidas exitosamente', resp);
	}

	async getApplicationById(id: number) {
		try {
			const app = await this.prisma.application.findUnique({
				where: { id },
				include: {
					payment: true,
					approvedBy: { select: { id: true, name: true, email: true } },
				},
			});
			if (!app) {
				return Utils.formatResponseFail('Solicitud no encontrada');
			}

			return Utils.formatResponseSuccess('Solicitud encontrada', Utils.formatDates(app));
		} catch (error) {
			return Utils.formatResponseFail('Solicitud no encontrada: ' + error.message);
		}
	}

	async getApplicationByIntRef(intReference: string) {
		const app = await this.prisma.application.findFirst({
			where: { referenceTransaction: intReference },
		});

		if (!app) {
			return Utils.formatResponseFail('Solicitud no encontrada');
		}

		return Utils.formatResponseSuccess('Solicitud encontrada', Utils.formatDates(app));
	}

	async filterApplications(filters: FilterApplicationsDto, role: number, idUser: number) {
		const { startDate, endDate, identificationNumber } = filters;

		const where: any = {};

		console.log('Filtros recibidos:', filters);

		// Filtro por fechas de creación
		if (startDate || endDate) {
			where.createdAt = {};

			if (startDate) {
				// Ajusta al inicio del día en UTC
				where.createdAt.gte = Utils.startOfDayUTC(new Date(startDate));
			}

			if (endDate) {
				where.createdAt.lte = Utils.endOfDayUTC(new Date(endDate));
			}
		}

		// Filtro por número de identificación
		if (identificationNumber) {
			where.identificationNumber = identificationNumber;
		}

		where.payment = {
			status: 'aprobado',
			...(role == 1 ? {} : { idCreador: idUser }),
		};

		const results = await this.prisma.application.findMany({
			where,
			include: {
				plan: true,
				approvedBy: {
					select: { id: true, name: true, email: true },
				},
				payment: true,
			},
			orderBy: { createdAt: 'desc' },
		});

		return Utils.formatResponseSuccess('Solicitudes filtradas obtenidas exitosamente', Utils.formatDates(results));
	}

	/* async approveApplication(id: number, adminUserId: number) {
    try {
      const response = await this.getApplicationById(id);
      const app = response.data;

      if (response.ok == false) {
        return Utils.formatResponseFail('Solicitud no encontrada');
      }

      if (app.approvedById) {
        return Utils.formatResponseFail('La solicitud ya ha sido aprobada');
      }

      const updatedApp = await this.prisma.application.update({
        where: { id },
        data: {
          approvedById: adminUserId,
          status: 'approved',
          approvedAt: new Date(),
        },
        select: {
          id: true,
          identificationNumber: true,
          status: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
          approvedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const client = await this.prisma.client.create({
        data: {
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
          appointmentExpirationDate: app.appointmentExpirationDate,
          documentType: app.documentType,
          referenceTransaction: app.referenceTransaction,
          applicationType: app.applicationType,
          period: app.period,
          identificationFront: app.identificationFront,
          identificationBack: app.identificationBack,
          identificationSelfie: app.identificationSelfie,
          pdfCompanyRuc: app.pdfCompanyRuc,
          pdfRepresentativeAppointment: app.pdfRepresentativeAppointment,
          pdfAppointmentAcceptance: app.pdfAppointmentAcceptance,
          pdfCompanyConstitution: app.pdfCompanyConstitution,
          authorizationVideo: app.authorizationVideo,
        },
      });

      const plan = await this.prisma.plan.findUnique({
        where: { id: app.planId },
      });
      // Calcular fechas
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + plan!.durationdays);

      // Crear suscripción
      await this.prisma.subscription.create({
        data: {
          clientId: client.id,
          planId: plan!.id,
          startDate,
          endDate,
        },
      });

      return Utils.formatResponseSuccess(
        'Solicitud aprobada',
        Utils.formatDates(updatedApp),
      ); // return
    } catch (error) {
      return Utils.formatResponseFail(
        'Error aprobando la solicitud: ' + error.message,
      );
    }
  } */
}
