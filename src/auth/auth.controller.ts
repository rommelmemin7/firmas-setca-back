import { Body, Controller, Get, Post, UseGuards, Request, Patch, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/_common/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post('login')
	login(@Body('email') email: string, @Body('password') password: string) {
		return this.authService.login(email, password);
	}

	@UseGuards(JwtAuthGuard)
	@Patch('change-password')
	async changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
		const userId = req.user.sub;
		return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
	}

	@UseGuards(JwtAuthGuard)
	@Get('profile')
	getProfile(@Request() req) {
		return req.user;
	}
}
