import { Controller, Get, Patch, Param, Body, ParseIntPipe, UseGuards, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/_common/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	/* @UseGuards(JwtAuthGuard) */
	@Post('register')
	register(@Body('name') name: string, @Body('email') email: string, @Body('password') password: string, @Body('roleId') roleId: number) {
		return this.usersService.register(name, email, password, roleId);
	}

	@UseGuards(JwtAuthGuard)
	@Get()
	async findAll() {
		return this.usersService.findAll();
	}

	@UseGuards(JwtAuthGuard)
	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.usersService.findOne(id);
	}

	@UseGuards(JwtAuthGuard)
	@Patch(':id')
	async update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateUserDto) {
		return this.usersService.update(id, data);
	}
}
