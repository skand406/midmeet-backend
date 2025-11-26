import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as http from 'http';

// ✅ 카카오 REST API 키는 서버 환경 변수에서 가져옵니다.


@Injectable()
export class MapService {
  constructor(private readonly httpService: HttpService) {}
  private readonly apiUrl = process.env.apiUrl ?? 'https://apis.vworld.kr/new2coord.do';
  private readonly apiKey = process.env.apiKey;

  // async getCoordinates(address: string) {

  //   const params = {
  //     q: address,
  //     output: 'json',
  //     epsg: 'epsg:4326',
  //     domain: process.env.BACK_URL,
  //     apiKey: this.apiKey
  //   };

  //   try{
  //     const response = await firstValueFrom(this.httpService.get(this.apiUrl,{params}));

  //     return response.data;
  //   } catch (err){
  //     throw err;
  //   }
  // }
  async getCoordinates(address: string){
  
    const url = `${process.env.KAKAO_URL}/address.json`;
    const agent = new http.Agent({ keepAlive: false });

    const res = await this.httpService.axiosRef.get(url, {
      httpAgent: agent,
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}`,
      },
      params: {
        query: address,
      },
    });
    console.log(url);
    const lng = res.data.documents[0].address.x;
    const lat =  res.data.documents[0].address.y;
    return { lat, lng  };
  }
}

