import { Controller, Get, Res } from '@nestjs/common';
import { OtpService } from './otp.service';
import { RouteVisualizerService } from './route-visualizer.service';

@Controller('otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
    private readonly visualizer: RouteVisualizerService
  ) {}

  @Get('otp-test')
  async otpTest() {
    //return this.otpService.testOTPConnection();
  }

  
}
