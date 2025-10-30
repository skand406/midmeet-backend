import { Controller, Get } from '@nestjs/common';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Get('otp-test')
  async otpTest() {
    //return this.otpService.testOTPConnection();
  }
}
