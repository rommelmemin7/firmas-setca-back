import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdatePaymentStatusDto {
  @IsString()
  @IsIn(['pendiente', 'aprobado', 'rechazado'])
  status: string;
}
