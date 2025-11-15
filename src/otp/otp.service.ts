import { HttpService } from '@nestjs/axios';
import { HttpException, HttpServer, Injectable, NotFoundException } from '@nestjs/common';
import * as turf from '@turf/turf';
import { PrismaService } from '../prisma/prisma.service';
import { ParticipantService } from '../party/services/participant.service';
import { Party, TransportMode } from '@prisma/client';
import { Feature, Polygon, MultiPolygon, FeatureCollection, GeoJsonProperties } from 'geojson'; // ✅ 타입 전용
import * as fs from 'fs';
import { RouteVisualizerService } from './route-visualizer.service'; // 경로 맞게
import csv from 'csv-parser';
import * as path from 'path';

@Injectable()
export class OtpService {
  constructor(
    private prismaService:PrismaService,
    private httpService:HttpService,
    ){}

  async testOTPConnection() {
      try {
          const res = await this.httpService.axiosRef.get(
              `${process.env.OTP_URL}/otp/traveltime/isochrone`,
          );
      console.log('✅ OTP 연결 성공:', res.data);
      return res.data;
      } catch (error) {
      console.error('❌ OTP 연결 실패:', error.message);
      throw error;
      }
  }
  async test(lat:number, lon:number, cutoff:string) {
    const now = new Date();
    now.setHours(8, 0, 0, 0); // 오후 12시로 고정
    const isoTime = now.toISOString().replace('Z', '+09:00');

    const link = `${process.env.OTP_URL}/otp/traveltime/isochrone`;

    try {
      const res = await this.httpService.axiosRef.get(
        link,
        {
          params: {
            batch: true,
            location: `${lat},${lon}`,
            time: isoTime, // 현재 시간 기준
            modes: 'WALK, TRANSIT',
            arriveBy: false,
            cutoff:cutoff,
          },
        },
      );

      console.log('✅ Isochrone 요청 성공');
      return res.data;
    } catch (err) {
      console.error('❌ Isochrone 요청 실패:', err.message);
      throw err;
    }
  }
  
  /* 중앙 좌표 */
  private async getCenter(party_id: string) {
    const participant_list = await this.prismaService.participant.findMany({ where: { party_id } });

    const points = participant_list
      .filter(p => p.start_lat !== null && p.start_lng !== null)
      .map((p) => turf.point([Number(p.start_lng), Number(p.start_lat)]));

    const center_point = turf.center(turf.featureCollection(points)).geometry.coordinates;
    return [center_point[1], center_point[0]];
  }
  

  /* 참여자 이동시간 중 최댓값 */
  private async getDurationTime(party_id: string) {
    const party = await this.prismaService.party.findUnique({ where: { party_id } });
    if (!party) throw new NotFoundException('파티가 존재하지 않습니다.');

    const date_time = `${party.date_time}`;
    const participant_list = await this.prismaService.participant.findMany({ where: { party_id } });

    const [center_lat, center_lng] = await this.getCenter(party_id);

    const times = await Promise.all(
      participant_list.map(async (p) => {
        const mode = this.getMode(p.transport_mode||"PUBLIC");
        const result = await this.getRoute(`${p.start_lat},${p.start_lng}`,`${center_lat},${center_lng}`,mode,date_time);
        return result.plan.itineraries[0].duration
      }));
    return Math.max(...times);
  }

  /*OTP 경로 조회*/
  async getRoute(from: string, to: string, mode:string, date_time:string) {
    const [date,time] = date_time.split('T');
     
    const link = `${process.env.OTP_URL}/otp/routers/default/plan`;

    const res = await this.httpService.axiosRef.get(
      link,
      {
        params: {
          fromPlace: from,  
          toPlace: to,    
          mode: mode, 
          date: date,
          time: time,
          arriveBy: false,
          numItineraries: 1,
        },
        headers: {
          Accept: 'application/json',  // ✅ HTML 말고 JSON만 받기
        },
      },
    );
    return res.data;
  }
  

  /* isochrone 호출 */
  private async getIsochrone(cutoff: string, location: string, mode: string, time: string) {
    const link = `${process.env.OTP_URL}/otp/traveltime/isochrone`;
    const res = await this.httpService.axiosRef.get(
      link,
      {
        params: { 
          batch: true, 
          location: location, 
          time: time, 
          modes: mode, 
          arriveBy: false, 
          cutoff: cutoff 
        }
      }
    );
    return res.data;
  }

  /* 모든 참여자의 등시선 */
  async getMidMeet(party_id: string) {
    const participant_list = await this.prismaService.participant.findMany({ where: { party_id } });
    const middle = await this.getDurationTime(party_id); // 🔥 1번만 계산
    const cutoff = `${Math.floor(middle / 60)}M`;
    const time = this.getIsoTime();

    const iso_list = await Promise.all(
      participant_list.map(async (p) => {
        const mode = this.getMode(p.transport_mode||"PUBLIC")
        const data = await this.getIsochrone(cutoff,`${p.start_lat},${p.start_lng}`,mode, time)
        return data;
      })
    );
    return iso_list;
  }

  /* 교차 영역 */
  async getCrossMid(party_id: string) {
    const list = await this.getMidMeet(party_id);
    let intersection:Feature<Polygon | MultiPolygon, GeoJsonProperties> | null = turf.multiPolygon([list[0].features[0].geometry.coordinates[0]]);
    
    for (let i = 1; i < list.length; i++) {
      if (!intersection) break;
      intersection = turf.intersect(turf.featureCollection([intersection, turf.multiPolygon([list[i].features[0].geometry.coordinates[0]])]));
    }
    if (intersection) return intersection;

    const [center_lat, center_lng] = await this.getCenter(party_id);
    return (await this.getIsochrone('10M', `${center_lat},${center_lng}`, 'CAR', this.getIsoTime())).features[0];
  }



  /* 교차영역 내 지하철 후보 */
  async getSubwayList(party_id: string) {
    const poly = await this.getCrossMid(party_id);
    const stops = await this.loadSubwayStops();
    const result = stops.filter(s => turf.booleanPointInPolygon(turf.point([s.lon, s.lat]), poly));
    return result;
  }
  /* 지하철역 로딩 */
  private async loadSubwayStops():Promise<{ id: string; name: string; lat: number; lon: number }[]> {
    return new Promise(resolve => {
      const stops: any[] = [];
      fs.createReadStream(path.resolve(__dirname, './stops.txt'))
        .pipe(csv())
        .on('data', r =>
          stops.push({ 
            id: r.stop_id, 
            name: r.stop_name, 
            lat: parseFloat(r.stop_lat), 
            lon: parseFloat(r.stop_lon) 
          }))
        .on('end', () => resolve(stops));
    }); 
  }
  /* 최종 중간지점 */
  async getMidPoint(party_id: string) {
    const party = await this.prismaService.party.findUnique({ where: { party_id } });
    if(!party) throw new NotFoundException('파티가 존재하지 않습니다.');

    const date = `${party.date_time}`;
    const participant_list = await this.prismaService.participant.findMany({ where: { party_id } });
    const stops = await this.getSubwayList(party_id);

    const results = await Promise.all(
      stops.map(async (stop) => {
        const times = await Promise.all(
          participant_list.map(async (p) =>{
            const mode = this.getMode(p.transport_mode||"PUBLIC");
            const time = await this.getRoute(`${p.start_lat},${p.start_lng}`,`${stop.lat},${stop.lon}`,mode,date);            
            if (!time.plan || !time.plan.itineraries?.length) return Infinity;

            return time.plan.itineraries[0].duration;
      }));
        const valid = times.filter(t => t < Infinity);
        const avg = valid.reduce((a, b) => a + b, 0) / valid.length;

        return { ...stop, avg };
      })
    );

    return results.sort((a, b) => a.avg - b.avg)[0];
  }
  private getIsoTime(date?: string) {
    const now = date ? new Date(date) : new Date();
    now.setHours(8, 0, 0, 0);
    return now.toISOString().replace('Z', '+09:00');
  }

  /* mode 변환 */
  private getMode(m: TransportMode) {
    return m === 'PUBLIC' ? 'WALK,TRANSIT' : 'CAR';
  }
  
  // private async loadContext(party_id: string) {
  //   const party = await this.prismaService.party.findUnique({ where: { party_id } });
  //   if (!party) throw new NotFoundException('파티 없음');

  //   const participants = await this.prismaService.participant.findMany({ where: { party_id } });

  //   if (participants.length === 0)
  //     throw new NotFoundException('참여자 없음');

  //   const date_time = `${party.date_time}`;
  //   const center = this.getCenter(participants);

  //   return { party, participants, date_time, center };
  // }
}