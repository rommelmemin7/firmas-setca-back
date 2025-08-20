// payment.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
	cors: { origin: '*' }, // ⚠️ abre para todos, luego puedes restringir
})
export class PaymentGateway {
	@WebSocketServer()
	server: Server;

	// Método para emitir eventos desde el backend
	sendPaymentUpdate(data: any) {
		this.server.emit('paymentStatus', {
			event: 'Payment status updated',
			data,
		});
	}
}
