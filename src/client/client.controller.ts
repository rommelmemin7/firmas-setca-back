import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClientService } from './client.service';
import { JwtAuthGuard } from 'src/_common/guards/jwt-auth.guard';

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}
  
  @UseGuards(JwtAuthGuard) 
  @Get()
  async getAllClients() {
    return this.clientService.getClientsWithPlanAndRemainingTime();
  }
}
