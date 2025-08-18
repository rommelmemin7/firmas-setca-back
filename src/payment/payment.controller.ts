import { Controller, Post, Body, Patch, Get, Param, ParseIntPipe, UseInterceptors, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { BufferToBase64Interceptor } from 'src/_common/guards/interceptors/buffer-to-base64.interceptor';
import { JwtAuthGuard } from 'src/_common/guards/jwt-auth.guard';

@Controller('payments')
@UseInterceptors(BufferToBase64Interceptor)
export class PaymentController {
	constructor(private readonly paymentService: PaymentService) {}

	@Post()
	create(@Body() createPaymentDto: CreatePaymentDto) {
		return this.paymentService.createPayment(createPaymentDto);
	}

	@UseGuards(JwtAuthGuard)
	@Patch(':id/status')
	updateStatus(@Param('id', ParseIntPipe) id: number, @Body() updateStatusDto: UpdatePaymentStatusDto) {
		return this.paymentService.updateStatus(id, updateStatusDto);
	}

	@Get('application/:applicationId')
	getByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
		return this.paymentService.getPaymentByApplication(applicationId);
	}
}
