import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  applicationId: number;

  @IsString()
  @IsNotEmpty()
  comprobanteNumber: string;

  @IsString()
  @IsNotEmpty()
  comprobanteImageBase64: string; // Imagen en Base64
}
