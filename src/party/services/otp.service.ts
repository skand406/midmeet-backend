import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  HttpServer,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as turf from '@turf/turf';
import { PrismaService } from '../../prisma/prisma.service';
import { ParticipantService } from './participant.service';
import { Party, TransportMode, Participant } from '@prisma/client';
import {
  Feature,
  Polygon,
  MultiPolygon,
  FeatureCollection,
  GeoJsonProperties,
} from 'geojson'; // ✅ 타입 전용
import * as fs from 'fs';
import csv from 'csv-parser';
import * as path from 'path';
import Flatbush from 'flatbush';
import geokdbush from 'geokdbush';

@Injectable()
export class OtpService {
  constructor(
    private prismaService: PrismaService,
    private httpService: HttpService,
  ) {}

  //공통 코드
  /*시간 변환 */
  private getIsoTime(date?: string) {
    const now = date ? new Date(date) : new Date();
    now.setHours(8, 0, 0, 0);
    return now.toISOString().replace('Z', '+09:00');
  }

  /* mode 변환 */
  private getMode(m: TransportMode) {
    return m === 'PUBLIC' ? 'WALK,TRANSIT' : 'CAR';
  }

  /* 공통 사용 데이터 */
  private async PartyData(party:Party,participants:Participant[]){//party_id: string) {
    //const party = await this.prismaService.party.findUnique({
    //  where: { party_id },
    //});
    //if (!party) throw new NotFoundException('파티 없음');
	//
    //const participants = await this.prismaService.participant.findMany({
    //  where: { party_id },
    //});
	//	
    //if (participants.length === 0) throw new NotFoundException('참여자 없음');

    const date_time = `${party.date_time}`;
    const points = participants
      .filter((p) => p.start_lat !== null && p.start_lng !== null)
      .map((p) => turf.point([Number(p.start_lng), Number(p.start_lat)]));
    const [center_lng, center_lat] = turf.center(turf.featureCollection(points))
      .geometry.coordinates;

    const maxTime = await this.getMaxDurationTime(
      participants,
      center_lat,
      center_lng,
      date_time,
    );

    return { participants, date_time, center_lat, center_lng, maxTime };
  }

  /* 참여자 이동시간 중 최댓값 */
  private async getMaxDurationTime(
    participants:Participant[],
    center_lat: number,
    center_lng: number,
    date_time: string,
  ) {
    const times = await Promise.all(
      participants.map(async (p) => {
        const mode = p.transport_mode||"PUBLIC";
        const result = await this.getRoute(`${p.start_lat},${p.start_lng}`,`${center_lat},${center_lng}`,mode,date_time);
        const duration = Math.min( ...(result?.plan?.itineraries?.map(i => i.duration) ?? [Infinity]));

        return duration;
      }));
    return Math.max(...times);
  }

  /*OTP 경로 조회*/
  async getRoute(
    from: string,
    to: string,
    transport_mode: TransportMode,
    date_time: string,
  ) {
    const [date, time] = date_time.split('T');

    const mode = this.getMode(transport_mode || 'PUBLIC');

    const link = `${process.env.OTP_URL}/otp/routers/default/plan`;

    const res = await this.httpService.axiosRef.get(link, {
      params: {
        fromPlace: from,
        toPlace: to,
        mode: mode,
        date: date,
        time: time,
        arriveBy: false,
        numItineraries: 10,
      },
      headers: {
        Accept: 'application/json', // ✅ HTML 말고 JSON만 받기
      },
    });
    return res.data;
  }

  /* isochrone 호출 */
  private async getIsochrone(
    cutoff: string,
    location: string,
    mode: string,
    time: string,
  ) {
    const link = `${process.env.OTP_URL}/otp/traveltime/isochrone`;
    const res = await this.httpService.axiosRef.get(link, {
      timeout: 20000,
      params: {
        batch: true,
        location: location,
        time: time,
        modes: mode,
        arriveBy: false,
        cutoff: cutoff,
      },
    });
    return res.data;
  }

  /* 모든 참여자의 등시선 */
  async getMidMeet(participants:Participant[],maxTime:number){//party_id: string) {
    //const { participants, date_time, center_lat, center_lng, maxTime } =
    //  await this.PartyData(party_id);

    const cutoff = `${Math.floor(maxTime / 60)}M`;
    const time = this.getIsoTime();
    console.log('midmeet');
    const iso_list = await Promise.all(
      participants.map(async (p) => {
        const mode = this.getMode(p.transport_mode || "PUBLIC");
        const key = `${cutoff}-${p.start_lat}-${p.start_lng}-${mode}`;

        return await this.cachedIso(
          key,
          () => this.getIsochrone(
            cutoff,
            `${p.start_lat},${p.start_lng}`,
            mode,
            time
          )
        );
      })
    );

    return iso_list;
  }

  /* 교차 영역 */
  async getCrossMid(party:Party,participants:Participant[]){//party_id: string) {
    const data = await this.PartyData(party,participants);
    //console.log('교차영역 계산 시작 -', party_id);
    const all_stops = await this.loadSubwayStops();

    const list = await this.getMidMeet(participants,data.maxTime);//party_id);
    console.log('등시선 로드 완료, 교차영역 계산 중...', list);
    let intersection: Feature<
      Polygon | MultiPolygon,
      GeoJsonProperties
    > | null = turf.multiPolygon([list[0].features[0].geometry.coordinates[0]]);

    for (let i = 1; i < list.length; i++) {
      if (!intersection) break;
      intersection = turf.intersect(
        turf.featureCollection([
          intersection,
          turf.multiPolygon([list[i].features[0].geometry.coordinates[0]]),
        ]),
      );
    }
    if (intersection) {
      const stops = await this.getSubwayList(intersection);
      if (stops.length === 0) {
        const [center_lng, center_lat] =
          turf.centerOfMass(intersection).geometry.coordinates;
        return this.getNearPoint(all_stops, center_lat, center_lng);
      }
      return await this.getMidPoint(participants, data.date_time, stops);//party_id, stops);
    }

    //const { participants, date_time, center_lat, center_lng, maxTime } =
    //await this.PartyData(party_id);


    return this.getNearPoint(all_stops, data.center_lat, data.center_lng);
  }

  /*중심점으로부터 제일 가까운 장소 */
  private getNearPoint(stops: any[], center_lat: number, center_lng: number) {
    const fc = turf.featureCollection(
      stops.map((p) => turf.point([Number(p.lng), Number(p.lat)], p)),
    );
    return turf.nearestPoint([center_lng, center_lat], fc).properties;
  }

  /* 교차영역 내 지하철 후보 */
  async getSubwayList(
    intersection: Feature<Polygon | MultiPolygon, GeoJsonProperties>,
  ) {
    const stops = await this.loadSubwayStops();
    const result = stops.filter((s) =>
      turf.booleanPointInPolygon(turf.point([s.lng, s.lat]), intersection),
    );
    return result;
  }
  /* 지하철역 로딩 */
  private async loadSubwayStops(): Promise<
    { id: string; name: string; lat: number; lng: number }[]
  > {
    return new Promise((resolve) => {
      const stops: any[] = [];
      fs.createReadStream(path.resolve(process.cwd(), 'src/data/stops.txt'))
        .pipe(csv())
        .on('data', (r) =>
          stops.push({
            id: r.stop_id,
            name: r.stop_name,
            lat: parseFloat(r.stop_lat),
            lng: parseFloat(r.stop_lng),
          }),
        )
        .on('end', () => resolve(stops));
    });
  }
  /* 최종 중간지점 */
  async getMidPoint(participants: Participant[], date_time: string, stops: any[]) {
    const results = await Promise.all(
      stops.map(async (stop) => {
        
        // 각 참여자 이동 시간
        const times = await Promise.all(
          participants.map(async (p) => {
            const mode = p.transport_mode || 'PUBLIC';
            const time = await this.getRoute(
              `${p.start_lat},${p.start_lng}`,
              `${stop.lat},${stop.lng}`,
              mode,
              date_time,
            );
            if (!time.plan || !time.plan.itineraries?.length) return Infinity;
            return time.plan.itineraries[0].duration;
          }),
        );


        // 유효 값만 필터
        const valid = times.filter((t) => t < Infinity);
        // ❗ 모든 참여자가 도달한 경우만 유지
        if (valid.length !== participants.length) {
          return { ...stop, avg: Infinity, std: Infinity };
        }

        // 평균
        const avg = valid.reduce((a, b) => a + b, 0) / valid.length;

        // 표준편차 계산
        const variance =
          valid.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / valid.length;
        const std = Math.sqrt(variance);

        return { ...stop, avg, std };
      }),
    );
    console.log('중간지점 후보 계산 완료:', results.map(r => ({id:r.id,avg:r.avg,std:r.std})));
    // **표준편차 → 평균 → 순으로 정렬**
    return results.sort((a, b) => {
      if (a.std === b.std) return a.avg - b.avg;
      return a.std - b.std;
    })[0];
}


  private isoCache = new Map<string, any>();
  //private routeCache = new Map<string, any>();
  private async cachedIso(key: string, fn: () => Promise<any>) {
    if (this.isoCache.has(key)) return this.isoCache.get(key);
    const data = await fn();
    this.isoCache.set(key, data);
    return data;
  }

  // private async cachedRoute(key: string, fn: () => Promise<any>) {
  //   if (this.routeCache.has(key)) return this.routeCache.get(key);
  //   const data = await fn();
  //   this.routeCache.set(key, data);
  //   return data;
  // }

}
