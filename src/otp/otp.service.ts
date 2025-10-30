import { HttpService } from '@nestjs/axios';
import { HttpServer, Injectable } from '@nestjs/common';
import * as turf from '@turf/turf';
import { PrismaService } from '../prisma/prisma.service';
import { ParticipantService } from '../party/services/participant.service';

@Injectable()
export class OtpService {
  constructor(
    private prismaService:PrismaService,
    private httpService:HttpService,
    private participantServerice:ParticipantService
    ){}
  
  async getParticipant(party_id:string){
    const participantList = await this.prismaService.participant.findMany({
      where: { party_id },
      select: {
        participant_id:true,
        transport_mode: true,
        start_lat: true,
        start_lng: true,
      },
    });

    const points = participantList
      .filter(p => p.start_lat !== null && p.start_lng !== null)
      .map((p) => turf.point([Number(p.start_lng), Number(p.start_lat)]));

    const center = turf.center(turf.featureCollection(points));
    const [centerLng, centerLat] = center.geometry.coordinates;

    return [centerLng, centerLat]; // 중간 지점
    //this.getRoute()

  }

  async testOTPConnection() {
      try {
          const res = await this.httpService.axiosRef.get(
              'http://midmeet.panpanya.kr/otp/',
          );
      console.log('✅ OTP 연결 성공:', res.data);
      return res.data;
      } catch (error) {
      console.error('❌ OTP 연결 실패:', error.message);
      throw error;
      }
  }

  
  async getIsochrone(lat: number, lon: number, cutoff = '30M17S') {
    const link = `${process.env.OTP_URL}/otp/traveltime/isochrone`;

    try {
      const res = await this.httpService.axiosRef.get(
        link,
        {
          params: {
            batch: true,
            location: `${lat},${lon}`,
            time: new Date().toISOString(), // 현재 시간 기준
            modes: 'WALK,TRANSIT',
            arriveBy: true,
            cutoff,
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

  
  async getRoute(from: string, to: string, mode:string) {
    const link = `${process.env.OTP_URL}/otp/routers/default/plan`;

    const res = await this.httpService.axiosRef.get(
      link,
      {
        params: {
          fromPlace: from,  // 서울시청
          toPlace: to,    // 종로3가
          mode: 'WALK,TRANSIT',
          date: '2025-10-23',
          time: '08:00am',
          arriveBy: false,
          numItineraries: 1,
        },
        headers: {
          Accept: 'application/json',  // ✅ HTML 말고 JSON만 받기
        },
      },
    );
  console.log('✅ 경로결과:', res.data.plan.itineraries[0]);

  return res.data;
  }
}