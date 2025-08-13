import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Asumo tienes este servicio
import { CreateApplicationDto } from './dto/create-application.dto';
import { formatDates } from 'src/_common/utils/utils';

@Injectable()
export class ApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async createApplication(dto: CreateApplicationDto) {
    // Podrías hacer validaciones adicionales acá si quieres
    try {
      const app = await this.prisma.application.create({
        data: {
          status: 'pending',
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
          appointmentExpirationDate: dto.appointmentExpirationDate
            ? new Date(dto.appointmentExpirationDate)
            : null,
          applicationType: dto.applicationType,
          documentType: dto.documentType,
          referenceTransaction: dto.referenceTransaction,
          period: dto.period,
          identificationFront: Buffer.from(dto.identificationFront, 'base64'),
          identificationBack: Buffer.from(dto.identificationBack, 'base64'),
          identificationSelfie: Buffer.from(dto.identificationSelfie, 'base64'),
          pdfCompanyRuc: dto.pdfCompanyRuc
            ? Buffer.from(dto.pdfCompanyRuc, 'base64')
            : null,
          pdfRepresentativeAppointment: dto.pdfRepresentativeAppointment
            ? Buffer.from(dto.pdfRepresentativeAppointment, 'base64')
            : null,
          pdfAppointmentAcceptance: dto.pdfAppointmentAcceptance
            ? Buffer.from(dto.pdfAppointmentAcceptance, 'base64')
            : null,
          pdfCompanyConstitution: dto.pdfCompanyConstitution
            ? Buffer.from(dto.pdfCompanyConstitution, 'base64')
            : null,
          authorizationVideo: dto.authorizationVideo
            ? Buffer.from(dto.authorizationVideo, 'base64')
            : null,

          // approvedById se deja null al crear
        },
      });
      return {message:"Solictud creada con exito",app};
    } catch (error) {
      throw new BadRequestException(
        'Error creando la solicitud: ' + error.message,
      );
    }
  }

  async getAllApplications() {
     const app = await this.prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return formatDates(app);

  }

  async getApplicationById(id: number) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: {
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!app) throw new NotFoundException('Solicitud no encontrada');
    return formatDates(app);
  }

  async approveApplication(id: number, adminUserId: number) {
    const app = await this.getApplicationById(id);

    if (app.approvedById) {
      throw new BadRequestException('Esta solicitud ya fue aprobada');
    }

    const updatedApp = await this.prisma.application.update({
      where: { id },
      data: {
        approvedById: adminUserId,
        status: 'approved',
      },
      select: {
        id: true,
        identificationNumber: true,
        status: true,
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

    return  formatDates(updatedApp);
  }
}
