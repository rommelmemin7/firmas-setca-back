import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { PaymentService } from 'src/payment/payment.service';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  providers: [ApplicationService],
  controllers: [ApplicationController],
  imports: [PaymentModule],
})
export class ApplicationModule {}
