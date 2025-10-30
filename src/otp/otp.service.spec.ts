import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';
import { ParticipantService } from '../party/services/participant.service';
import { JwtService } from '@nestjs/jwt';
import { MapService } from '../party/services/map.service';

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule], // ✅ HttpService 의존성 해결
      providers: [OtpService, PrismaService, ParticipantService,
        { provide: JwtService, useValue: {} },
        { provide: MapService, useValue: {} }, ], // ✅ PrismaService 주입
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  it('should be defined', async () => {
    const result = await service.getRoute('37.3908865,126.8627405','37.347061,126.820412','car');
    console.log(result); // ✅ 콘솔 확인

    expect(result).toBeDefined();
  });
});
