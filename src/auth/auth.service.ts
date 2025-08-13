// auth.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Utils } from 'src/_common/utils/utils';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(
    name: string,
    email: string,
    password: string,
    roleId: number,
  ) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return Utils.formatResponseFail('El correo ya está registrado');
      }

      const roleExists = await this.prisma.role.findUnique({
        where: { id: roleId },
      });
      if (!roleExists) {
       return Utils.formatResponseFail('El roleId proporcionado no existe');
      }
      const hashedPassword: string = await bcrypt.hash(password, 10);
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          roleId,
          status: 'active',
        },
      });

      return Utils.formatResponseSuccess('Usuario registrado', {userId: user.id});
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Error al registrar usuario: ${errorMessage}`,
      );
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      return  Utils.formatResponseFail('Credenciales inválidas');
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
      role: user.role.name,
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
}
