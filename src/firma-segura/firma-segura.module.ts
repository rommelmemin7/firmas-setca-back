import { Module } from '@nestjs/common';
import { FirmaSeguraService } from './firma-segura.service';
import { FirmaSeguraController } from './firma-segura.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [FirmaSeguraService],
  imports: [HttpModule],
  controllers: [FirmaSeguraController],
  exports: [FirmaSeguraService],
})
export class FirmaSeguraModule {}
