import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanDto } from './create-plan.dto';
import { IsOptional, IsIn } from 'class-validator';

export class UpdatePlanDto extends PartialType(CreatePlanDto) {
  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'El status debe ser "active" o "inactive"',
  })
  status?: 'active' | 'inactive';
}
