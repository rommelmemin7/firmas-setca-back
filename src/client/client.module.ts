import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
	providers: [ClientService, PrismaService],
	controllers: [ClientController],
})
export class ClientModule {}
