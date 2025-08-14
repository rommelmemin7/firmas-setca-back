import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PlanService } from './plan.service';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from 'src/_common/guards/jwt-auth.guard';

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() data: CreatePlanDto) {
    return this.planService.create(data);
  }

  @Get()
  findAll() {
    return this.planService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.planService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdatePlanDto) {
    return this.planService.update(id, data);
  }
}
