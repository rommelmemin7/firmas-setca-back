// payment.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
	cors: { origin: '*' }, // ⚠️ abre para todos, luego puedes restringir
})
export class PaymentGateway {
	@WebSocketServer()
	server: Server;

	private clients = new Map<string, string>();

	handleConnection(client: Socket) {
		const referenceTransaction = client.handshake.query.referenceTransaction as string;
		if (referenceTransaction) {
			this.clients.set(referenceTransaction, client.id);
			console.log(`Cliente conectado: ${referenceTransaction} -> ${client.id}`);
		}
	}

	handleDisconnect(client: Socket) {
		for (const [key, value] of this.clients.entries()) {
			if (value === client.id) this.clients.delete(key);
		}
	}

	// Método para emitir eventos desde el backend
	sendPaymentUpdate(referenceTransaction: string, data: any) {
		const socketId = this.clients.get(referenceTransaction);
		if (socketId) {
			this.server.to(socketId).emit('paymentStatus', {
				event: 'Payment status updated',
				data,
			});
			console.log(`Evento enviado a ${referenceTransaction}`);
		} else {
			console.log(`Cliente con referenceTransaction ${referenceTransaction} no conectado`);
		}
	}
}
