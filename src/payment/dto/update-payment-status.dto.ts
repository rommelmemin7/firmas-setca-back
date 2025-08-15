import { IsIn, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class UpdatePaymentStatusDto {
  @IsString()
  @IsIn(['pendiente', 'aprobado', 'rechazado'])
  status: string;

  @IsInt()
  adminUserId: number;
}
