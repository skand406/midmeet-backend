import { Controller, Get, Res } from '@nestjs/common';
import { OtpService } from './services/otp.service';
import { KakaoService } from './services/kakao.service';


@Controller('otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
    private kakaoService:KakaoService,
  ) {}

  @Get()
  async otpTest() {

    //return this.kakaoService.findAICoursePlaces('cmi4fbmmu0000p5a8veh4fjca');
    //return this.kakaoService.findCustomCoursePlaces('cmgtao6uo0004vp3kd1s7b3x7','cmgtaojsk0007vp3k82lqsnkl')
    return this.otpService.getCrossMid('cmgtgcvde0000vprgzmvixr3m');
  }

  @Get('/kakao')
  async kakaoTest() {
    return this.kakaoService.kakaoSearch('분위기 좋은',37.41618,126.88447,1000,'FD6','distance');
  }
  
  @Get('/route')
  async routeTest(){
    
    return this.otpService.getRoute('37.5585,126.9368','37.5033,126.7660','PUBLIC','2025-11-14T08:00:00');
  }
  

}
