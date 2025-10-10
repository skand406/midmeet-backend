import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// ✅ 카카오 REST API 키는 서버 환경 변수에서 가져옵니다.


@Injectable()
export class MapService {
  constructor(private readonly httpService: HttpService) {}
  private readonly apiUrl = process.env.apiUrl ?? 'https://apis.vworld.kr/new2coord.do';
  private readonly apiKey = process.env.apiKey;

  async getCoordinates(address: string) {

    const params = {
      q: address,
      output: 'json',
      epsg: 'epsg:4326',
      domain: process.env.BACK_URL,
      apiKey: this.apiKey
    };

    try{
      const response = await firstValueFrom(this.httpService.get(this.apiUrl,{params}));
      
      return response.data;
    } catch (err){
      throw err;
    }
  }
}

