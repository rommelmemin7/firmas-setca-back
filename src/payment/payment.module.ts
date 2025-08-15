import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { FirmaSeguraModule } from 'src/firma-segura/firma-segura.module';

@Module({
  providers: [PaymentService, PrismaService],
  controllers: [PaymentController],
  imports: [FirmaSeguraModule],
})
export class PaymentModule {}
