import { Controller, Get, Res } from '@nestjs/common';
import { OtpService } from './services/otp.service';
import { KakaoService } from './services/kakao.service';


@Controller('otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
    private kakaoService:KakaoService,
  ) {}

  @Get('')
  async otpTest() {

    return this.kakaoService.findCourseList('cmgtao6uo0004vp3kd1s7b3x7',1,37.41618,126.88447);
  }

  @Get('/kakao')
  async kakaoTest() {
    return this.kakaoService.kakaoSearch('분위기 좋은',37.41618,126.88447,1000,'FD6');
  }
  
  @Get('/route')
  async routeTest(){
    
    return this.otpService.getRoute('37.5585,126.9368','37.5033,126.7660','WALK,TRANSIT','2025-11-14T08:00:00');
  }
  

}
