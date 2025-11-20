import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OtpService } from './otp.service';
import { NotFoundError } from 'rxjs';
import { CourseService } from './course.service';
import type { tag as CourseTag } from '../dto/create-course.dto';

@Injectable()
export class KakaoService {

    constructor(
        private readonly httpService: HttpService,
        private prisma: PrismaService,
        private otpService:OtpService,
        private courseService:CourseService
    ) {}

async kakaoSearch(keyword: string, lat: number, lng: number, radius: number,code:string,sort:string) {
  const url = `${process.env.KAKAO_URL}`;

  const res = await this.httpService.axiosRef.get(url, {
    headers: {
      Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}`,
    },
    params:{
      query:keyword,
      category_group_code	:code,
      x:lng,
      y:lat,
      radius:radius,
      sort:sort
    }

  });
  console.log(url);
  return res.data.documents;
}

  async findCustomCoursePlaces(party_id:string, course_id:string, place_lat?:number, place_lng?:number){
    const course = await this.prisma.course.findUnique({ where:{course_id}});
    if(!course) throw new NotFoundException('코스가 존재하지 않습니다.');
    
    const courseTag = course.tag as unknown as CourseTag;

    let targetLat = place_lat ?? 0;
    let targetLng = place_lng ?? 0;
    let radius = 500;

    if (course.course_no === 1) {
      //const {lat, lng} = await this.otpService.getCrossMid('cmgtgcvde0000vprgzmvixr3m');
      targetLat = 37.41618//lat;
      targetLng = 126.88447//lon;
      radius = 1000;
    }
    //console.log(courseTag);
    const places: any[] =[];

    for (const keyword of courseTag.primaryQueries) {
      const results = await this.kakaoSearch(keyword, targetLat, targetLng, radius, courseTag.category ,'distance');
      //console.log(results)
      places.push(...results);        // 🔥 배열 확장

    }

  
    const uniqueMap = new Map();
    for (const p of places) uniqueMap.set(p.id, p);
    let r = Array.from(uniqueMap.values());
      
    
    //const filtered = r.filter(p => tag.secondaryFilters.includes(p.category_name));

    return r;
  }

  // async findAICoursePlaces(party_id: string) {
  //   // 1. 파티 코스 전체 가져오기
  //   const course_list= await this.prisma.course.findMany({
  //     where: { party_id },
  //     orderBy: { course_no: 'asc' },
  //   });

  //   const results:any[] = [];
    
    
  //   // 초기 탐색 좌표
  //   let seedPoints:{ lat: number; lng: number }[] = [];//await this.otpService.getCrossMid(party_id);
  //   let radius = 1000;

  //   for (const course of course_list) {
  //     const courseTag = course.tag as unknown as CourseTag;
  //     const collected:any[] = [];

  //     // seedPoints 세팅 (최초 1회)
  //     if (seedPoints.length === 0) {
  //       const { lat, lng } = await this.otpService.getCrossMid('cmgtgcvde0000vprgzmvixr3m');
  //       seedPoints.push({ lat, lng });
  //     }

  //     // 🔥 seedPoint 각각으로 검색 수행
  //     for (const pt of seedPoints) {
  //       const places :any[]= [];

  //       for (const keyword of courseTag.primaryQueries) {
  //         const res = await this.kakaoSearch(keyword,pt.lat,pt.lng,radius,courseTag.category,'accuracy');
  //         places.push(...res);
  //       }

  //       // 중복 제거
  //       const uniqueMap = new Map();
  //       for (const p of places) uniqueMap.set(p.id, p);
  //       const uniqueList = Array.from(uniqueMap.values());

  //       collected.push(...uniqueList);
  //     }

  //     // 🔥 거리순 / 인기순 / 다양성 기준 3개씩 선택
  //     const distanceTop3 = this.pickByDistance(collected);
  //     const popularityTop3 = this.pickByPopularity(collected);
  //     const diversityTop3 = this.pickByDiversity(collected);

  //     results.push({
  //       course_no: course.course_no,
  //       distance: distanceTop3,
  //       popularity: popularityTop3,
  //       diversity: diversityTop3,
  //     });

  //     // 🔥 다음 탐색을 위한 seedPoints 갱신
  //     seedPoints = diversityTop3.map(p => ({
  //       lat: Number(p.y),
  //       lng: Number(p.x),
  //     }));

  //     radius = 500; // 이후엔 좁게 탐색
  //   }

  //   return results;
  // }
  // // 🔥 거리순
  // private pickByDistance(list: any[]) {
  //   return [...list]
  //     .sort((a, b) => Number(a.distance) - Number(b.distance))
  //     .slice(0, 3);
  // }

  // // 🔥 인기순 (카카오 accuracy 결과 그대로)
  // private pickByPopularity(list: any[]) {
  //   return list.slice(0, 3);
  // }

  // // 🔥 다양성(분산도)
  // private pickByDiversity(list: any[]) {
  //   const picked: any[] = [];
  //   const threshold = 80; // 최소 거리 (m)

  //   for (const place of list) {
  //     // 첫 번째는 무조건 선택
  //     if (picked.length === 0) {
  //       picked.push(place);
  //       continue;
  //     }

  //     // 거리 분산 체크
  //     const isFar = picked.every(p => {
  //       const dx = Number(p.x) - Number(place.x);
  //       const dy = Number(p.y) - Number(place.y);
  //       const dist = Math.sqrt(dx * dx + dy * dy) * 88000; // degree → meter 변환
  //       return dist > threshold;
  //     });

  //     if (isFar) picked.push(place);
  //     if (picked.length === 3) break;
  //   }

  //   return picked;
  // }
}
