import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Utils } from 'src/_common/utils/utils';
import { FirmaSeguraService } from 'src/firma-segura/firma-segura.service';
import { addDays } from 'date-fns';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private firmaSeguraService: FirmaSeguraService,
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

    // Convertir Base64 → Buffer
    let comprobanteBuffer: Buffer;
    try {
      comprobanteBuffer = Buffer.from(data.comprobanteImageBase64, 'base64');
    } catch (error) {
      return Utils.formatResponseFail('Formato de imagen inválido');
    }

    const payment = await this.prisma.payment.create({
      data: {
        applicationId: data.applicationId,
        comprobanteNumber: data.comprobanteNumber,
        comprobanteImage: comprobanteBuffer,
      },
    });

    return Utils.formatResponseSuccess(
      'Pago creado exitosamente',
      Utils.formatDates(payment),
    );
  }

  /*  async updateStatus(id: number, data: UpdatePaymentStatusDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });

    if (!payment) {
      return Utils.formatResponseFail('Pago no encontrado');
    }

    if (payment?.status === 'aprobado' && data.status === 'aprobado') {
      return Utils.formatResponseFail('El pago ya ha sido aprobado');
    }

    const updatePayment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: data.status,
        approvedAt:
          data.status === 'aprobado' || data.status === 'rechazado'
            ? new Date()
            : null,
      },
    });

    const app = await this.prisma.application.findUnique({
      where: { id: updatePayment.applicationId },
    });

    if (updatePayment.status === 'aprobado' && app) {
      try {
        const client = await this.prisma.client.create({
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

        const firmaResponse = await this.firmaSeguraService.registerApplication(
          {
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
            appointmentExpirationDate: app.appointmentExpirationDate
              ? new Date(app.appointmentExpirationDate)
              : null,
            applicationType: app.applicationType,
            documentType: app.documentType,
            referenceTransaction: app.referenceTransaction,
            period: app.period!,
            identificationFront: Buffer.from(app.identificationFront).toString(
              'base64',
            ),
            identificationBack: Buffer.from(app.identificationBack).toString(
              'base64',
            ),
            identificationSelfie: Buffer.from(
              app.identificationSelfie,
            ).toString('base64'),

            pdfCompanyRuc: app.pdfCompanyRuc
              ? Buffer.from(app.pdfCompanyRuc).toString('base64')
              : null,
            pdfRepresentativeAppointment: app.pdfRepresentativeAppointment
              ? Buffer.from(app.pdfRepresentativeAppointment).toString('base64')
              : null,
            pdfAppointmentAcceptance: app.pdfAppointmentAcceptance
              ? Buffer.from(app.pdfAppointmentAcceptance).toString('base64')
              : null,
            pdfCompanyConstitution: app.pdfCompanyConstitution
              ? Buffer.from(app.pdfCompanyConstitution).toString('base64')
              : null,
            authorizationVideo: app.authorizationVideo
              ? Buffer.from(app.authorizationVideo).toString('base64')
              : null,
          },
        );

        await this.prisma.application.update({
          where: { id: app.id },
          data: {
            externalStatus: firmaResponse.status,
            lastCheckedAt: new Date(),
            approvedById: data.adminUserId,
            status: 'Aprobado',
            approvedAt: new Date(),
          },
          include: {
            approvedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return Utils.formatResponseSuccess(
          'Estado del pago actualizado exitosamente',
          Utils.formatDates(updatePayment),
        );
      } catch (error) {
        console.error('Error registrando la solicitud en FirmaSegura:', error);
        return Utils.formatResponseFail(
          'Error al registrar la solicitud en FirmaSegura',
        );
      }
    }
  } */

  async updateStatus(id: number, data: UpdatePaymentStatusDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });

    if (!payment) {
      return Utils.formatResponseFail('Pago no encontrado');
    }

    if (payment.status === 'aprobado' && data.status === 'aprobado') {
      return Utils.formatResponseFail('El pago ya ha sido aprobado');
    }

    const updatePayment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: data.status,
        approvedAt:
          data.status === 'aprobado' || data.status === 'rechazado'
            ? new Date()
            : null,
      },
    });

    if (updatePayment.status !== 'aprobado') {
      return Utils.formatResponseSuccess(
        'Estado del pago actualizado',
        Utils.formatDates(updatePayment),
      );
    }

    const app = await this.prisma.application.findUnique({
      where: { id: updatePayment.applicationId },
    });
    if (!app) {
      return Utils.formatResponseFail('La solicitud asociada no existe');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: app.planId },
    });
    if (!plan) {
      return Utils.formatResponseFail(
        'El plan asociado a la solicitud no existe',
      );
    }

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

        const firmaResponse = await this.firmaSeguraService.registerApplication(
          {
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
            appointmentExpirationDate: app.appointmentExpirationDate
              ? new Date(app.appointmentExpirationDate)
              : null,
            applicationType: app.applicationType,
            documentType: app.documentType,
            referenceTransaction: app.referenceTransaction,
            period: app.period!,
            identificationFront: Buffer.from(app.identificationFront).toString(
              'base64',
            ),
            identificationBack: Buffer.from(app.identificationBack).toString(
              'base64',
            ),
            identificationSelfie: Buffer.from(
              app.identificationSelfie,
            ).toString('base64'),
            pdfCompanyRuc: app.pdfCompanyRuc
              ? Buffer.from(app.pdfCompanyRuc).toString('base64')
              : null,
            pdfRepresentativeAppointment: app.pdfRepresentativeAppointment
              ? Buffer.from(app.pdfRepresentativeAppointment).toString('base64')
              : null,
            pdfAppointmentAcceptance: app.pdfAppointmentAcceptance
              ? Buffer.from(app.pdfAppointmentAcceptance).toString('base64')
              : null,
            pdfCompanyConstitution: app.pdfCompanyConstitution
              ? Buffer.from(app.pdfCompanyConstitution).toString('base64')
              : null,
            authorizationVideo: app.authorizationVideo
              ? Buffer.from(app.authorizationVideo).toString('base64')
              : null,
          },
        );

        await tx.application.update({
          where: { id: app.id },
          data: {
            externalStatus: firmaResponse.status,
            lastCheckedAt: new Date(),
            approvedById: data.adminUserId,
            status: 'Aprobado',
            approvedAt: new Date(),
          },
          include: {
            approvedBy: { select: { id: true, name: true, email: true } },
          },
        });
      });

      return Utils.formatResponseSuccess(
        'Estado del pago actualizado y solicitud registrada exitosamente',
        Utils.formatDates(updatePayment),
      );
    } catch (error) {
      console.error('Error registrando la solicitud en FirmaSegura:', error);
      return Utils.formatResponseFail(
        'Error al registrar la solicitud en FirmaSegura: ' + error.message,
      );
    }
  }

  async getPaymentByApplication(applicationId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { applicationId },
    });

    if (!payment) {
      return Utils.formatResponseFail('Pago no encontrado');
    }

    return Utils.formatResponseSuccess(
      'Pago encontrado',
      Utils.formatDates(payment),
    );
  }
}
