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
    private participantServerice:ParticipantService,
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
  async getCenter(party_id:string){
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
    return [centerLat,centerLng];

  }
  async getMiddleTime(party_id:string){
    const party = await this.prismaService.party.findUnique({where:{party_id}});
    if(!party) throw new NotFoundException('파티가 존재하지 않습니다.');
    const date_time = `${party.date_time}`
    const participantList = await this.prismaService.participant.findMany({
      where: { party_id },
      select: {
        transport_mode: true,
        start_lat: true,
        start_lng: true,
      },
    });
    const [center_lat,center_lng] = await this.getCenter(party_id);
    const travelTimes = await Promise.all( 
      participantList.map(async (p)=>{
        
        const {transport_mode, start_lng, start_lat} = p;
        let mode ='CAR';
        if(transport_mode==='PUBLIC') mode = 'WALK,TRANSIT';
        else if(transport_mode === 'PRIVATE') mode= 'CAR';
        const route = await this.getRoute(`${start_lat},${start_lng}`,`${center_lat},${center_lng}`,mode, date_time);
        return route.plan.itineraries[0].duration;
      })
    );
    return Math.max(...travelTimes);
  }
  async getRoute(from: string, to: string, mode:string, date_time:string) {
    const [date,time] = date_time.split('T');
     
    const link = `${process.env.OTP_URL}/otp/routers/default/plan`;

    const res = await this.httpService.axiosRef.get(
      link,
      {
        params: {
          fromPlace: from,  // 서울시청
          toPlace: to,    // 종로3가
          mode: mode, 
          date: '2025-11-14',
          //time: time,
          arriveBy: false,
          numItineraries: 1,
        },
        headers: {
          Accept: 'application/json',  // ✅ HTML 말고 JSON만 받기
        },
      },
    );
  //console.log('✅ 경로결과:', res.data.plan.itineraries[0]);

    return res.data;
  }

  async getIsochrone(cutoff:string, location:string, mode:string, time:string) {
    const link = `${process.env.OTP_URL}/otp/traveltime/isochrone`;
    const res = await this.httpService.axiosRef.get(
      link,
      {
        params: {
          batch: true,
          location,
          time: time,//new Date().toISOString(),
          modes: mode,
          arriveBy: false,
          cutoff:cutoff,
        },
      },
    );
    //console.log(res.data.features)
    return res.data;

  
  }

  async getMidMeet(party_id:string){
    const party = await this.prismaService.party.findUnique({where:{party_id},select:{date_time:true}});

    const participantList = await this.prismaService.participant.findMany({
      where: { party_id },
      select: {
        transport_mode: true,
        start_lat: true,
        start_lng: true,
      },
    });

    const now = !party?.date_time ? new Date() : new Date('2025-11-14');
    now.setHours(8, 0, 0, 0); // 오후 12시로 고정
    const isoTime = now.toISOString().replace('Z', '+09:00');
    // 각 참여자별 등시선 좌표 요청
    const isochroneList = await Promise.all(
      participantList.map(async (p) => {
        let mode = '';
        if (p.transport_mode === 'PUBLIC') mode = 'TRANSIT,WALK';
        else if (p.transport_mode === 'PRIVATE') mode = 'CAR';

        const cutoff = this.formatToCutoff(await this.getMiddleTime(party_id));
        const location = `${p.start_lat},${p.start_lng}`;

        const data = await this.getIsochrone(`${cutoff}`, location, mode, isoTime);
        //turf.cleanCoords(data.features)
        //turf.polygon(data.features[0]?.geometry?.coordinates || [])
        //fs.writeFileSync('isochrone_dump.txt', JSON.stringify(data, null, 2));

        return data;
     }),
    );
    //console.dir(isochroneList, { depth: null, colors: true });
    fs.writeFileSync('isochrone_dump.json', JSON.stringify(isochroneList, null, 2));
  
    return isochroneList; // [[참여자1 polygon], [참여자2 polygon], ...]

  }

  formatToCutoff(seconds:number){
    const minutes = Math.floor(seconds/60);
    const remain = seconds%60;
    return `${minutes}M`;
  }

  async getCrossMid(party_id: string) {
    const list = await this.getMidMeet(party_id);
    let intersection: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null = turf.multiPolygon([list[0].features[0].geometry.coordinates[0]]); 

    for (let i = 1; i < list.length; i++) {
      // 현재 intersection을 첫 번째 인자로 사용
       
      const nextPolygon =list[i].features[0].geometry.coordinates[0];
      
      //turf.multiPolygon([nextPolygon]);
      //console.log(intersection);

      if (!intersection) break; 
      intersection = turf.intersect(turf.featureCollection([intersection,turf.multiPolygon([nextPolygon])]));
    
    }

    // 1️⃣ 교차 영역 계산 후 intersection 확보됨
    if (intersection) {
      // 2️⃣ 교차 영역 내 지하철역 찾기
      console.log("교차 지점 있음");
      return intersection;
    }
    else{
      // const participantList = await this.prismaService.participant.findMany({
      //   where: { party_id },
      //   select: {
      //     transport_mode: true,
      //     start_lat: true,
      //     start_lng: true,
      //   },
      // });
      // const points = participantList
      //   .filter(p => p.start_lat !== null && p.start_lng !== null)
      //   .map((p) => turf.point([Number(p.start_lng), Number(p.start_lat)]));
      
      // const polygon = turf.convex(turf.featureCollection(points));
      // if (!polygon) {
      //   const now = new Date() 
      //   now.setHours(8, 0, 0, 0); // 오후 12시로 고정
      //   const isoTime = now.toISOString().replace('Z', '+09:00');
      //   const [center_lat,center_lng] = await this.getCenter(party_id);
      //   //cutoff:string, location:string, mode:string, time:string
      //   return await this.getIsochrone('30M',`${center_lat},${center_lng}`,'WALK,TRANSIT',isoTime);
      // }
      // console.log("교차 지점 없음");

      // return polygon;//await this.getSubwayList(party_id, polygon);
      const now = new Date() 
      now.setHours(8, 0, 0, 0); // 오후 12시로 고정
      const isoTime = now.toISOString().replace('Z', '+09:00');
      const [center_lat,center_lng] = await this.getCenter(party_id);
      //cutoff:string, location:string, mode:string, time:string
      const poly =await this.getIsochrone('10M',`${center_lat},${center_lng}`,'CAR',isoTime);
      return poly.features[0];
    }
    //return intersection;
    
  }

  async getSubwayList(party_id:string){
    const area = await this.getCrossMid(party_id);

    const subwayStops = await this.loadSubwayStops(); // ✅ 반드시 await 필요

    const insideStops = subwayStops.filter((s) =>
      turf.booleanPointInPolygon(turf.point([s.lon, s.lat]), area));
    // console.log(insideStops.length);
    // console.log(insideStops);
    return insideStops;
  }

  async loadSubwayStops(): Promise<{ id: string; name: string; lat: number; lon: number }[]> {
    return new Promise((resolve, reject) => {
    const stops: any[] = [];
    const filePath = path.resolve(__dirname, './stops.txt'); // 경로 확인 필수

    fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (row) => {
        if (!row.stop_id || !row.stop_name || !row.stop_lat || !row.stop_lon) return;
        stops.push({
          id: row.stop_id,
          name: row.stop_name,
          lat: parseFloat(row.stop_lat),
          lon: parseFloat(row.stop_lon),
        });
      })
      .on('end', () => {
        // console.log(`✅ 불러온 데이터 개수: ${stops.length}`);
        // console.log(stops.slice(0, 5)); // 앞부분 미리보기
        resolve(stops);
      })
      .on('error', reject);
  });
  }

  async getMidPoint(party_id:string){
    const party = await this.prismaService.party.findUnique({where:{party_id}});
    if(!party) throw new NotFoundException('파티가 존재하지 않습니다.');
    const date_time = `${party.date_time}`
    const participantList = await this.prismaService.participant.findMany({
      where: { party_id },
      select: {
        transport_mode: true,
        start_lat: true,
        start_lng: true,
      },
    });
    const [transport_mode,start_lat,start_lng] = participantList
    const stopList = await this.getSubwayList(party_id);


    // 3️⃣ 각 지하철역에 대해 참여자별 이동시간 계산
    const stopTimes = await Promise.all(
      stopList.map(async (stop) => {
        const times = await Promise.all(
          participantList.map(async (p) => {
            let mode = '';
            if (p.transport_mode === 'PUBLIC') mode = 'WALK, TRANSIT';
            else if (p.transport_mode === 'PRIVATE') mode = 'CAR';
            
            const t = await this.getRoute(`${p.start_lat}, ${p.start_lng}`, `${stop.lat}, ${stop.lon}`,mode,date_time);         // 교통수단
            if (!t.plan || !t.plan.itineraries?.length) return Infinity;
            return t.plan.itineraries[0].duration;
          })
        );
        const validTimes = times.filter((t) => t !== Infinity);
        const avg =
          validTimes.length > 0 ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length : Infinity;

        return { stop: stop.name, lat: stop.lat, lon: stop.lon, avg };
      })
    );

    // 4️⃣ 평균이 가장 작은(가장 접근성 좋은) 지하철역 선택
    const bestStop = stopTimes.sort((a, b) => a.avg - b.avg)[0];
    return bestStop;
  }
}