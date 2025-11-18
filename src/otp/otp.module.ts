import { Module } from '@nestjs/common';
import { OtpService } from './services/otp.service';
import { OtpController } from './otp.controller';
import { HttpModule } from '@nestjs/axios';
import { PartyModule } from '../party/party.module';
import { JwtModule } from '@nestjs/jwt';
import { KakaoService } from './services/kakao.service';

@Module({
  imports: [HttpModule,PartyModule,JwtModule],
  controllers: [OtpController],
  providers: [OtpService,KakaoService],
  exports:[
    KakaoService
  ]
})
export class OtpModule {}
