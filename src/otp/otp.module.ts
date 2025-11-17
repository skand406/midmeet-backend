import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { HttpModule } from '@nestjs/axios';
import { PartyModule } from '../party/party.module';
import { JwtModule } from '@nestjs/jwt';
import { RouteVisualizerService } from './route-visualizer.service';
import { KakaoService } from './kakao.service';

@Module({
  imports: [HttpModule,PartyModule,JwtModule],
  controllers: [OtpController],
  providers: [OtpService,RouteVisualizerService,KakaoService],
  exports:[
    KakaoService
  ]
})
export class OtpModule {}
