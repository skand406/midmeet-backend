import { Controller, Get, Res } from '@nestjs/common';
import { OtpService } from './services/otp.service';
import { KakaoService } from './services/kakao.service';
import { MapService } from './services/map.service';
import { HttpService } from '@nestjs/axios';

@Controller('otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
    private kakaoService: KakaoService,
    private mapService: MapService,
    private httpService: HttpService,
  ) {}

  @Get()
  async otpTest() {
    const link = `${process.env.OTP_URL}/otp/routers/default/plan`;

    // const res = await this.httpService.axiosRef.get(link, {
    //   params: {
    //     fromPlace: '37.5028031,126.7371047',
    //     toPlace: '37.4500221,126.653488',
    //     mode: 'WALK,TRANSIT',
    //     date: new Date().toISOString().split('T')[0],
    //     time: new Date().toISOString().split('T')[1].split('.')[0],
    //     arriveBy: false,
    //     numItineraries: 5,
    //   },
    //   headers: {
    //     Accept: 'application/json', // ✅ HTML 말고 JSON만 받기
    //   },
    // });
    // return res.data;
    // return this.otpService.getRoute(
    //   '37.5028031,126.7371047',
    //   '37.4500221,126.653488',
    //   'PUBLIC',
    //   '2025-11-14T08:00:00',
    // );
    //return this.mapService.getCoordinates('인천 연수구 경원대로 지하 480');
    // return this.kakaoService.findAICoursePlaces(
    //   'cmi88yayx0000vpds6rymj6x4',
    //   37.45687,
    //   126.70575,
    // );
    //return this.kakaoService.findCustomCoursePlaces('cmgtao6uo0004vp3kd1s7b3x7','cmgtaojsk0007vp3k82lqsnkl')
    //return this.otpService.getCrossMid('cmgtgcvde0000vprgzmvixr3m');
  }

  @Get('/kakao')
  async kakaoTest() {
    return ''; //this.kakaoService.kakaoKeywordSearch('분위기 좋은',37.41618,126.88447,1000,'FD6','distance');
  }

  @Get('/route')
  async routeTest() {
    return this.otpService.getRoute(
      '37.5585,126.9368',
      '37.5033,126.7660',
      'PUBLIC',
      '2025-11-14T08:00:00',
    );
  }
}
