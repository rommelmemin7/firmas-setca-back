import { IsOptional, IsString, IsEmail, MaxLength, IsInt } from 'class-validator';

export class UpdateUserDto {
	@IsOptional()
	@IsString()
	@MaxLength(100)
	name?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsString()
	@MaxLength(20)
	phone?: string;

	@IsOptional()
	@IsString()
	@MaxLength(20)
	status?: string;

	@IsOptional()
	@IsInt()
	descuento?: number;
}
