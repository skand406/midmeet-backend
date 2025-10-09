import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// ✅ 카카오 REST API 키는 서버 환경 변수에서 가져옵니다.
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY ;
const KAKAO_GEOCODE_URL = 'https://dapi.kakao.com/v2/local/search/address.json';

@Injectable()
export class MapService {
  constructor(private readonly httpService: HttpService) {}

  async getCoordinates(address: string): Promise<{ lat: number; lng: number }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(KAKAO_GEOCODE_URL, {
          params: { query: address },
          headers: {
            // ✅ 서버에서 안전하게 REST API 키를 사용
            Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
          },
        }),
      );

      const document = response.data.documents[0];
      
      if (!document) {
        throw new InternalServerErrorException('좌표를 찾을 수 없는 주소입니다.');
      }

      // 경도(x)와 위도(y)를 반환
      return {
        lat: parseFloat(document.y),
        lng: parseFloat(document.x),
      };
    } catch (error) {
      console.error('카카오 지오코딩 오류:', error.response?.data || error.message);
      // ✅ 403 Forbidden 에러도 여기서 서버 에러로 처리
      throw new InternalServerErrorException('좌표 변환 서비스에 문제가 발생했습니다.');
    }
  }
}

