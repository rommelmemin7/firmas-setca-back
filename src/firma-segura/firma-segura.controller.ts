import { Controller, Post, Body } from '@nestjs/common';
import { FirmaSeguraService } from './firma-segura.service';

@Controller('firma-segura')
export class FirmaSeguraController {
  constructor(private readonly service: FirmaSeguraService) {}
  ClientService;
  @Post('register')
  async register(@Body() body: any) {
    return this.service.registerApplication(body);
  }
}
