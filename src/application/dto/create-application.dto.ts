/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsDateString, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateApplicationDto {
	@IsString()
	@MaxLength(10)
	identificationNumber: string;

	@IsString()
	@MaxLength(100)
	applicantName: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	applicantLastName?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	applicantSecondLastName?: string;

	@IsString()
	@IsOptional()
	@MaxLength(10)
	fingerCode?: string;

	@IsEmail()
	@MaxLength(100)
	emailAddress: string;

	@IsString()
	@MaxLength(20)
	cellphoneNumber: string;

	@IsString()
	city: string;

	@IsString()
	province: string;

	@IsString()
	@MinLength(15)
	@MaxLength(100)
	address: string;

	@IsString()
	countryCode: string;

	@IsString()
	@IsOptional()
	@MaxLength(13)
	companyRuc?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	positionCompany?: string;

	@IsString()
	@IsOptional()
	@MaxLength(250)
	companySocialReason?: string;

	@IsDateString()
	@IsOptional()
	appointmentExpirationDate?: string;

	@IsString()
	applicationType: string;

	@IsString()
	documentType: string;

	@IsString()
	@MaxLength(150)
	referenceTransaction: string;

	@IsString()
	period: string;

	// Para los campos tipo bytes puedes manejar base64 strings, o definir otro DTO/propiedad para el upload
	identificationFront: string; // base64 string
	identificationBack: string; // base64 string
	identificationSelfie: string; // base64 string

	@IsOptional()
	pdfCompanyRuc?: string; // base64 string

	@IsOptional()
	pdfRepresentativeAppointment?: string;

	@IsOptional()
	pdfAppointmentAcceptance?: string;

	@IsOptional()
	pdfCompanyConstitution?: string;

	@IsOptional()
	authorizationVideo?: string;

	@IsOptional()
	idCreador?: number;

	@IsNotEmpty({ message: 'El planId es obligatorio' })
	@IsInt({ message: 'El planId debe ser un número entero' })
	planId: number;
}
