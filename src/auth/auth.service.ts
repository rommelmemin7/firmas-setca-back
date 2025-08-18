// auth.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Utils } from 'src/_common/utils/utils';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      return Utils.formatResponseFail('Credenciales inválidas');
    }

    const isPasswordValid: boolean = await bcrypt.compare(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      return Utils.formatResponseFail('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role.id,
    };

    const token: string = this.jwtService.sign(payload);

    return Utils.formatResponseSuccess('Inicio de sesión exitoso', {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
    });
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar en la base de datos
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return Utils.formatResponseSuccess('Contraseña actualizada correctamente');
  }
}
