import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
	@IsInt()
	applicationId: number;

	@IsString()
	@IsNotEmpty()
	comprobanteNumber: string;

	@IsString()
	@IsOptional()
	bank: string;

	@IsString()
	@IsOptional()
	accountNumber: string;

	@IsString()
	@IsOptional()
	comprobanteImageBase64: string; // Imagen en Base64

	@IsString()
	@IsOptional()
	tipoPago: string; // Imagen en Base64
}
