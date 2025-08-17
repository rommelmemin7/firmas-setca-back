import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class FirmaSeguraService {
  private readonly logger = new Logger(FirmaSeguraService.name);
  private readonly apiToken = process.env.FIRMA_SEGURA_TOKEN?.trim();

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async registerApplication(data: any) {
    const response$ = this.httpService.post(
      'https://api.dev-firmaseguraec.com/collector/request',
      data,
      { headers: { Authorization: `Bearer ${this.apiToken}` } },
    );

    const response = await firstValueFrom(response$);
    return response.data;
  }

  async checkApplicationStatus(referenceTransaction: string) {
    const response$ = this.httpService.get(
      'https://api.dev-firmaseguraec.com/gateway/request/status',
      {
        headers: { Authorization: `Bearer ${this.apiToken}` },
        params: { referenceTransaction },
      },
    );

    const response = await firstValueFrom(response$);
    return response.data;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateApplicationsStatus() {
    const applications = await this.prisma.application.findMany({
      where: {
        externalStatus: {
          in: [
            'REGISTERED',
            'VALIDATING',
            'REFUSED',
            'ERROR',
            'GENERATED',
            'EXPIRED',
            'PENDING',
            'MANUALLY_VALIDATING',
            'AUTOMATICALLY_VALIDATING',
            'COMPLETED',
          ],
        },
      },
    });

    for (const app of applications) {
      try {
        const statusResponse = await this.checkApplicationStatus(
          app.referenceTransaction,
        );

        console.log(
          `Verificando estado de la solicitud ${JSON.stringify(statusResponse)}...`,
        );

        // 👀 Solo actualiza si cambia el estado
        if (statusResponse.status !== app.externalStatus) {
          const newObservationEntry = `${statusResponse.status} - ${new Date().toLocaleDateString('es-EC')}`;

          await this.prisma.application.update({
            where: { id: app.id },
            data: {
              externalStatus: statusResponse.status,
              observation: `${app.observation ?? ''}${app.observation ? '\n' : ''}${newObservationEntry}`,
              lastCheckedAt: new Date(),
            },
          });

          this.logger.log(
            `Solicitud ${app.referenceTransaction} actualizada a ${statusResponse.status}`,
          );
        } else {
          // 👇 Si no cambió, solo actualiza la fecha de verificación
          await this.prisma.application.update({
            where: { id: app.id },
            data: {
              lastCheckedAt: new Date(),
            },
          });

          this.logger.log(
            `Solicitud ${app.referenceTransaction} sin cambios de estado (${statusResponse.status})`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error actualizando solicitud ${app.referenceTransaction}: ${error}`,
        );
      }
    }
  }
}
