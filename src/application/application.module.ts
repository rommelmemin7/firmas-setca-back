import { forwardRef, Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
	providers: [ApplicationService],
	controllers: [ApplicationController],
	imports: [forwardRef(() => PaymentModule)],
	exports: [ApplicationService],
})
export class ApplicationModule {}
