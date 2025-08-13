import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ApplicationModule } from './application/application.module';
import { ClientModule } from './client/client.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, ApplicationModule, ClientModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
