import { Controller, Post, Body, Query, Param, ParseIntPipe, Get } from '@nestjs/common';
import { FirmaSeguraService } from './firma-segura.service';

@Controller('firma-segura')
export class FirmaSeguraController {
	constructor(private readonly service: FirmaSeguraService) {}
	ClientService;
	@Post('register')
	async register(@Body() body: any) {
		return this.service.registerApplication(body);
	}

	@Get('resend/:id')
	async resend(@Param('id', ParseIntPipe) id: number) {
		return this.service.resendAplication(id);
	}
}
