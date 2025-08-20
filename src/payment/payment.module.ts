import { forwardRef, Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { FirmaSeguraModule } from 'src/firma-segura/firma-segura.module';
import { HttpModule } from '@nestjs/axios';
import { ApplicationModule } from 'src/application/application.module';
import { PaymentGateway } from './payment.gateway';

@Module({
	providers: [PaymentService, PrismaService, PaymentGateway],
	controllers: [PaymentController],
	imports: [FirmaSeguraModule, HttpModule, forwardRef(() => ApplicationModule)],
	exports: [PaymentService, PaymentGateway],
})
export class PaymentModule {}
