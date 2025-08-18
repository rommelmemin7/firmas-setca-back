import { Injectable } from '@nestjs/common';
import { Utils } from 'src/_common/utils/utils';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClientService {
	constructor(private readonly prisma: PrismaService) {}

	async getClientsWithPlanAndRemainingTime() {
		try {
			const clients = await this.prisma.client.findMany({
				include: {
					subscriptions: {
						where: { status: 'active' },
						include: { plan: true },
					},
				},
			});

			return clients.map((client) => {
				const subscription = client.subscriptions[0];
				let remainingDays = 0;

				console.log('Client:', client);
				console.log('Subscription:', subscription);

				if (subscription) {
					const today = new Date();
					const endDate = new Date(subscription.endDate);
					const diffTime = endDate.getTime() - today.getTime();
					remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				}

				return {
					id: client.id,
					name: client.applicantName,
					lastName: client.applicantLastName,
					email: client.emailAddress,
					plan: subscription ? subscription.plan.name : null,
					planDescription: subscription ? subscription.plan.description : null,
					subscriptionStart: subscription ? subscription.startDate : null,
					subscriptionEnd: subscription ? subscription.endDate : null,
					remainingDays,
				};
			});
		} catch (error) {
			return Utils.formatResponseFail('Error aprobando la solicitud: ' + error.message);
		}
	}
}
