import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { NotFoundError } from 'rxjs';
import { CourseService } from '../course/course.service';
import type { tag as CourseTag } from '../../dto/create-course.dto';
import * as http from 'http';

@Injectable()
export class KakaoService {
  constructor(
    private readonly httpService: HttpService,
    private prisma: PrismaService,
    private otpService: OtpService,
    private courseService: CourseService,
  ) {}

  async kakaoKeywordSearch(
    keyword: string,
    lat: number,
    lng: number,
    radius: number,
    code: string,
    sort: string,
  ) {
    const url = `${process.env.KAKAO_URL}/keyword.json`;
    const agent = new http.Agent({ keepAlive: false });

    const res = await this.httpService.axiosRef.get(url, {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}`,
      },
      httpAgent: agent,
      params: {
        query: keyword,
        category_group_code: code,
        x: lng,
        y: lat,
        radius: radius,
        sort: sort,
      },
    });
    console.log(url);
    return res.data.documents;
  }

  async kakaoCategorySearch(
    lat: number,
    lng: number,
    radius: number,
    code: string,
    sort: string,
  ) {
    const url = `${process.env.KAKAO_URL}/category.json`;
    const agent = new http.Agent({ keepAlive: false });

    const res = await this.httpService.axiosRef.get(url, {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}`,
      },
      httpAgent: agent,
      params: {
        category_group_code: code,
        x: lng,
        y: lat,
        radius: radius,
        sort: sort,
      },
    });
    console.log(url);
    return res.data.documents;
  }
  async findCustomCoursePlaces(
    party_id: string,
    course_id: string,
    place_lat: number,
    place_lng: number,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { course_id },
    });
    if (!course) throw new NotFoundException('코스가 존재하지 않습니다.');

    const courseTag = course.tag as unknown as CourseTag;

    const targetLat = place_lat;
    const targetLng = place_lng;
    let radius = 500;

    if (course.course_no === 1) radius = 1000;

    //console.log(courseTag);
    const places: any[] = [];

    for (const keyword of courseTag.primaryQueries) {
      const results = await this.kakaoKeywordSearch(
        keyword,
        targetLat,
        targetLng,
        radius,
        courseTag.category,
        'distance',
      );
      //console.log(results)
      places.push(...results); // 🔥 배열 확장
    }

    const uniqueMap = new Map();
    for (const p of places) uniqueMap.set(p.id, p);
    let r = Array.from(uniqueMap.values());

    if (r.length === 0) {
      r = await this.kakaoCategorySearch(
        targetLat,
        targetLng,
        radius,
        courseTag.category,
        'distance',
      );
    }
    //const filtered = r.filter(p => tag.secondaryFilters.includes(p.category_name));

    return r;
  }

  async findAICoursePlaces(course_list: any[], lat: number, lng: number) {
    // const course_list = await this.prisma.course.findMany({
    //   where: { party_id },
    //   orderBy: { course_no: 'asc' },
    // });

    // 🔥 기준별 결과 저장
    let seedDistance: { lat: number; lng: number }[] = [];
    let seedAccuracy: { lat: number; lng: number }[] = [];
    let seedDiversity: { lat: number; lng: number }[] = [];

    const resultDistance: any[] = [];
    const resultAccuracy: any[] = [];
    const resultDiversity: any[] = [];

    // 최초 seed 좌표 = mid point
    //37.41618,126.88447,1000
    seedDistance = [{ lat, lng }];
    seedAccuracy = [{ lat, lng }];
    seedDiversity = [{ lat, lng }];

    let radius = 1000;

    for (const course of course_list) {
      const tag = course.tag as unknown as CourseTag;

      /** -------------------------
       * 1) 거리순 탐색(distance)
       --------------------------*/
      const pickDist = await this.searchAndPickOne(
        tag,
        seedDistance[0],
        radius,
        'distance',
      );
      resultDistance.push({
        course_id: course.course_id,
        place: pickDist,
      });
      seedDistance = [{ lat: Number(pickDist.y), lng: Number(pickDist.x) }];

      /** -------------------------
       * 2) 인기순 탐색(accuracy)
       --------------------------*/
      const pickAcc = await this.searchAndPickOne(
        tag,
        seedAccuracy[0],
        radius,
        'accuracy',
      );
      resultAccuracy.push({
        course_id: course.course_id,
        place: pickAcc,
      });
      seedAccuracy = [{ lat: Number(pickAcc.y), lng: Number(pickAcc.x) }];

      /** -------------------------
       * 3) 분산 탐색(diversity)
       --------------------------*/
      const pickDiv = await this.searchAndPickDiversity(
        tag,
        seedDiversity[0],
        radius,
      );
      resultDiversity.push({
        course_id: course.course_id,
        place: pickDiv,
      });
      seedDiversity = [{ lat: Number(pickDiv.y), lng: Number(pickDiv.x) }];

      radius = 500; // 이후 탐색 radius 감소
    }

    return {
      distance: resultDistance,
      accuracy: resultAccuracy,
      diversity: resultDiversity,
    };
  }

  private async searchAndPickOne(
    tag: CourseTag,
    seed: { lat: number; lng: number },
    radius: number,
    sortType: 'accuracy' | 'distance',
  ) {
    const { lat, lng } = seed;
    const places: any[] = [];

    for (const keyword of tag.primaryQueries) {
      const res = await this.kakaoKeywordSearch(
        keyword,
        lat,
        lng,
        radius,
        tag.category,
        sortType,
      );
      places.push(...res);
      if (res.length === 0) {
        const cat = await this.kakaoCategorySearch(
          lat,
          lng,
          radius,
          tag.category,
          sortType,
        );
        places.push(...cat);
      }
    }

    const unique = Array.from(new Map(places.map((p) => [p.id, p])).values());
    if (unique.length === 0) throw new Error('검색 결과 없음');

    return unique[0]; // 🔥 Top1 반환
  }
  private async searchAndPickDiversity(
    tag: CourseTag,
    seed: { lat: number; lng: number },
    radius: number,
  ) {
    const { lat, lng } = seed;
    const places: any[] = [];

    // accuracy 우선 정렬로 가져오되 분산 기준 선택
    for (const keyword of tag.primaryQueries) {
      const res = await this.kakaoKeywordSearch(
        keyword,
        lat,
        lng,
        radius,
        tag.category,
        'accuracy',
      );
      places.push(...res);

      if (res.length === 0) {
        const cat = await this.kakaoCategorySearch(
          lat,
          lng,
          radius,
          tag.category,
          'accuracy',
        );
        places.push(...cat);
      }
    }

    const unique = Array.from(new Map(places.map((p) => [p.id, p])).values());
    if (unique.length === 0) {
      if (places.length > 0) return places[0];
    }
    let best = unique[0];
    let bestDist = -1;

    for (const place of unique) {
      const dx = Number(place.x) - lng;
      const dy = Number(place.y) - lat;
      const dist = Math.sqrt(dx * dx + dy * dy) * 88000; // meter

      if (dist > bestDist) {
        bestDist = dist;
        best = place;
      }
    }

    return best;
  }
}
