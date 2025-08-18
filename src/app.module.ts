import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ApplicationModule } from './application/application.module';
import { ClientModule } from './client/client.module';
import { PaymentModule } from './payment/payment.module';
import { PlanModule } from './plan/plan.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FirmaSeguraModule } from './firma-segura/firma-segura.module';

@Module({
	imports: [PrismaModule, AuthModule, UsersModule, ApplicationModule, ClientModule, PaymentModule, PlanModule, ScheduleModule.forRoot(), FirmaSeguraModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
