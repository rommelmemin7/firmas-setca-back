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

@Controller('applications')
@UseInterceptors(BufferToBase64Interceptor)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  async create(@Body() dto: CreateApplicationDto) {
    return this.applicationService.createApplication(dto);
  }

  @UseGuards(JwtAuthGuard) 
  @Get()
  async findAll() {
    return this.applicationService.getAllApplications();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.applicationService.getApplicationById(id);
  }

  @UseGuards(JwtAuthGuard) 
  @Patch(':id/approve')
  async approve(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const adminUserId = req.user.sub;
    return this.applicationService.approveApplication(id, adminUserId);
  }
}
