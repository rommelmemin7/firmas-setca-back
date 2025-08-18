import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Utils } from 'src/_common/utils/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlanService {
	constructor(private prisma: PrismaService) {}

	async create(data: CreatePlanDto) {
		const plan = await this.prisma.plan.create({ data });
		return Utils.formatResponseSuccess('Plan creado exitosamente', plan);
	}

	async findAll() {
		const plans = await this.prisma.plan.findMany({
			orderBy: { createdAt: 'desc' },
		});
		return Utils.formatResponseSuccess('Planes obtenidos exitosamente', plans);
	}

	async findOne(id: number) {
		const plan = await this.prisma.plan.findUnique({ where: { id } });
		if (!plan) {
			return Utils.formatResponseFail(`Plan con ID ${id} no encontrado`);
		}
		return Utils.formatResponseSuccess('Plan obtenido exitosamente', plan);
	}

	async update(id: number, data: UpdatePlanDto) {
		const updatePlan = await this.prisma.plan.update({
			where: { id },
			data,
		});
		if (!updatePlan) {
			return Utils.formatResponseFail(`Plan con ID ${id} no encontrado`);
		}
		return Utils.formatResponseSuccess('Plan actualizado exitosamente', updatePlan);
	}
}
