import { Controller, Get, Res } from '@nestjs/common';
import { OtpService } from './otp.service';
import { RouteVisualizerService } from './route-visualizer.service';
import { KakaoService } from './kakao.service';

@Controller('otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
    private readonly visualizer: RouteVisualizerService,
    private kakaoService: KakaoService
  ) {}

  @Get()
  async otpTest() {
    return this.otpService.getCrossMid('cmgtgcvde0000vprgzmvixr3m');
  }

  @Get('/kakao')
  async kakakoTest() {
    return this.kakaoService.kakaoSearch('한식',37.41618,126.88447,1000);
  }
}
