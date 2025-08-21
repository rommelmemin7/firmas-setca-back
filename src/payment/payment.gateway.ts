// payment.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
	cors: true, // ⚠️ abre para todos, luego puedes restringir
	path: '/socket.io', // 👈 explícalo para evitar confusiones
	transports: ['websocket', 'polling'], // 👈 permite WebSocket y Polling
})
export class PaymentGateway {
	@WebSocketServer()
	server: Server;

	private clients = new Map<string, string>();

	afterInit(server: Server) {
		// Logs útiles del adapter (errores internos)
		const anyAdapter: any = server.of('/').adapter;
		if (anyAdapter?.on) {
			anyAdapter.on('error', (err: any) => {
				console.error('[ADAPTER ERROR]', err);
			});
		}
		console.log('[WS] Server initialized. Namespaces:', [...server._nsps.keys()]);
	}

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
