import { Module } from '@nestjs/common';
import { PartyService } from './services/party/party.service';
import { PartyController } from './party.controller';
import { UserModule } from 'src/user/user.module';
import { ParticipantService } from './services/participant/participant.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { MapService } from './services/map/map.service';
import { HttpModule } from '@nestjs/axios';
import { CourseService } from './services/course/course.service';
import { OtpService } from './services/otp/otp.service';
import { KakaoService } from './services/kakao/kakao.service';
import { OtpController } from './otp.controller';
import { GuestService } from './services/guest.service';
import { ResultService } from './services/result/result.service';
import { CommonService } from './services/common/common.service';
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
    GuestService,
    ResultService,
    CommonService,
  ],
  exports: [
    ParticipantService, // OtpModule에서 필요한 서비스
    PartyService,
    MapService,
  ],
})
export class PartyModule {}
