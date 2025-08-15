import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Utils } from 'src/_common/utils/utils';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

      if (name.length === 0) {
        return Utils.formatResponseFail('El nombre no puede estar vacío');
      }

      if (email.length === 0) {
        return Utils.formatResponseFail('El correo no puede estar vacío');
      }

      if (password.length === 0) {
        return Utils.formatResponseFail('La contraseña no puede estar vacía');
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

      return Utils.formatResponseSuccess('Usuario registrado', {
        userId: user.id,
      });
    } catch (error: unknown) {
      return Utils.formatResponseFail('Error al registrar el usuario');
    }
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    return Utils.formatResponseSuccess(
      'Usuarios obtenidos exitosamente',
      users,
    );
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return Utils.formatResponseFail('Usuario no encontrado');
    }

    return Utils.formatResponseSuccess('Usuario encontrado', user);
  }

  async update(id: number, data: UpdateUserDto) {
    try {
      const exists = await this.prisma.user.findUnique({ where: { id } });

      if (!exists) {
        return Utils.formatResponseFail('Usuario no encontrado');
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser && existingUser.id !== id) {
        return Utils.formatResponseFail('El correo ya está registrado');
      }

      const userUpdate = await this.prisma.user.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          updatedAt: new Date(),
          status: data.status,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          role: { select: { id: true, name: true } },
          createdAt: true,
          updatedAt: true,
        },
      });

      return Utils.formatResponseSuccess(
        'Usuario actualizado exitosamente',
        userUpdate,
      );
    } catch (e) {
      return Utils.formatResponseFail(
        'Error al actualizar el usuario ' + e.message,
      );
    }
  }
}
