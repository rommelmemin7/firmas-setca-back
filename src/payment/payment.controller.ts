import { Controller, Post, Body, Patch, Get, Param, ParseIntPipe, UseInterceptors, UseGuards, Res, HttpStatus, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { BufferToBase64Interceptor } from 'src/_common/guards/interceptors/buffer-to-base64.interceptor';
import { JwtAuthGuard } from 'src/_common/guards/jwt-auth.guard';
import type { Response } from 'express';
import { ApplicationService } from 'src/application/application.service';
import { PaymentGateway } from './payment.gateway';

@Controller('payments')
@UseInterceptors(BufferToBase64Interceptor)
export class PaymentController {
	constructor(
		private readonly paymentService: PaymentService,
		private readonly appService: ApplicationService,
		private readonly paymentGateway: PaymentGateway
	) {}

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

	@Post('payphone')
	async handlePayphoneResponse(@Body('id') id: string, @Body('clientTxId') clientTxId: string) {
		console.log('Payphone - Transaction ID:', id);
		return this.paymentService.getPaymentStatusPayphone(id, clientTxId);
	}

	@Post('request-deuna')
	async requestPayment(@Body('idSolicitud') idSolicitud: number) {
		return this.paymentService.requestPaymentDeuna(idSolicitud);
	}

	@Post('info-deuna')
	async infoPayment(@Body('transaccionId') transaccionId: string) {
		return this.paymentService.getPaymentStatusDeuna(transaccionId);
	}

	@Post('cancel-deuna')
	async cancelacionDeuna(@Body('transaccionId') transaccionId: string) {
		return this.paymentService.anularPaymentDeuna(transaccionId);
	}

	@Post('webhook')
	async handleWebhook(@Body() data: any, @Res() res: Response) {
		console.log('Webhook recibido de DeUna:', data);

		if (!data?.status || !data?.idTransaction) {
			return res.status(HttpStatus.BAD_REQUEST).send('Payload inválido');
		}

		if (data.status === 'SUCCESS') {
			try {
				const app = await this.appService.getApplicationByIntRef(data.internalTransactionReference);

				if (!app) {
					return res.status(HttpStatus.NOT_FOUND).send('Solicitud no encontrada');
				}

				console.log(app.data);
				if (app.data.payment.status !== 'aprobado') {
					await this.paymentService.updateStatus(app.data.id, {
						status: data.status == 'SUCCESS' ? 'aprobado' : 'rechazado',
						adminUserId: 1,
					});
					this.paymentGateway.sendPaymentUpdate(app.data.referenceTransaction, {
						reference: data.internalTransactionReference,
						status: data.status,
						amount: data.amount,
						customerId: data.customerIdentification,
						currency: data.currency,
						date: data.date,
						description: data.description,
					});
				} else {
					console.log('Solicitud aprobada previamente');
				}
				return res.status(HttpStatus.OK).send('OK');
			} catch (error) {
				console.error('Error procesando webhook:', error);
				return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error interno');
			}
		}

		return res.status(HttpStatus.OK).send('No procesado');
	}

	@Post('test-socket')
	async testSocket(@Body() data: any) {
		const resp = await this.paymentGateway.sendPaymentUpdate(data.referenceTransaction, {
			reference: data.reference || 'TEST123',
			status: data.status || 'pendiente',
			amount: data.amount || 100,
			customer: data.customer || 'Cliente de prueba',
		});

		console.log('Resp Gateway:', resp);

		return { message: 'Evento enviado' };
	}
}
