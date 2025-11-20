import { Module } from '@nestjs/common';
import { PartyService } from './services/party.service';
import { PartyController } from './party.controller';
import { UserModule } from 'src/user/user.module';
import { ParticipantService } from './services/participant.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { MapService } from './services/map.service';
import { HttpModule } from '@nestjs/axios';
import { CourseService } from './services/course.service';
import { OtpService } from './services/otp.service';
import { KakaoService } from './services/kakao.service';
import { OtpController } from './otp.controller';
@Module({
  imports: [UserModule, JwtModule, HttpModule, UserModule, AuthModule],
  controllers: [PartyController, OtpController],
  providers: [
    PartyService,
    ParticipantService,
    MapService,
    CourseService,
    OtpService,
    KakaoService,
  ],
  exports: [
    ParticipantService, // OtpModule에서 필요한 서비스
    PartyService,
    MapService,
  ],
})
export class PartyModule {}
