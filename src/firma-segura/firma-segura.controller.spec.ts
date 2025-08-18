import { Test, TestingModule } from '@nestjs/testing';
import { FirmaSeguraController } from './firma-segura.controller';

describe('FirmaSeguraController', () => {
	let controller: FirmaSeguraController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [FirmaSeguraController],
		}).compile();

		controller = module.get<FirmaSeguraController>(FirmaSeguraController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
