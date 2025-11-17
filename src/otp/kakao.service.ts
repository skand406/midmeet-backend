import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { CourseService } from 'src/party/services/course.service';

@Injectable()
export class KakaoService {

    constructor(
        private readonly httpService: HttpService,
    ) {}

    async kakaoSearch(keyword: string, lat: number, lng: number,radius:number) {
        const url = `${process.env.KAKAO_URL}`;


        const res = await this.httpService.axiosRef.get(url, {
            headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}` },
            params:{
                query:keyword,
                x:`${lat}`,
                y:`${lng}`,
                radius:`${radius}`,
                sort:'distance'
            }
            });

        return res.data.documents; // 장소 리스트
  }
}
