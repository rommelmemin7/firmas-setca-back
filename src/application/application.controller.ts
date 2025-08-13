import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from 'src/_common/guards/jwt-auth.guard';
import { BufferToBase64Interceptor } from 'src/_common/guards/interceptors/buffer-to-base64.interceptor';
// Si usas guard para proteger rutas de admin

@Controller('applications')
@UseInterceptors(BufferToBase64Interceptor)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  async create(@Body() dto: CreateApplicationDto) {
    return this.applicationService.createApplication(dto);
  }

  @UseGuards(JwtAuthGuard) // Solo admins con token pueden acceder
  @Get()
  async findAll() {
    return this.applicationService.getAllApplications();
  }

  @UseGuards(JwtAuthGuard) // Solo admins con token pueden acceder
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.applicationService.getApplicationById(id);
  }

  @UseGuards(JwtAuthGuard) // Solo admins con token pueden acceder
  @Patch(':id/approve')
  async approve(@Param('id', ParseIntPipe) id: number, @Req() req) {
    // req.user debe contener info del admin logueado (por ejemplo id)
    const adminUserId = req.user.sub;
    return this.applicationService.approveApplication(id, adminUserId);
  }
}
