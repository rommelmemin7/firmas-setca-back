import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Utils } from 'src/_common/utils/utils';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

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

  async updateStatus(id: number, data: UpdatePaymentStatusDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });

    if (!payment) {
      return Utils.formatResponseFail('Pago no encontrado');
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

    return Utils.formatResponseSuccess(
      'Estado del pago actualizado exitosamente',
      Utils.formatDates(updatePayment),
    );
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
