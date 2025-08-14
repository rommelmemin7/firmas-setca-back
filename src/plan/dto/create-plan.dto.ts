import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  MinLength,
  IsIn,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationdays?: number;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'], {
    message: 'El status debe ser "active" o "inactive"',
  })
  status?: string;
}
