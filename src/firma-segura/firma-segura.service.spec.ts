import { Test, TestingModule } from '@nestjs/testing';
import { FirmaSeguraService } from './firma-segura.service';

describe('FirmaSeguraService', () => {
	let service: FirmaSeguraService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [FirmaSeguraService],
		}).compile();

		service = module.get<FirmaSeguraService>(FirmaSeguraService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
