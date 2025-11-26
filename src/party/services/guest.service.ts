
import { randomUUID } from "crypto";
import { CourseGuestDto, GuestDto, ParticipantGuestDto, PartyInfoGuestDto } from "../dto/guest.dto";
import { CourseService } from "./course.service";
import { KakaoService } from "./kakao.service";
import { MapService } from "./map.service";
import { OtpService } from "./otp.service";
import { ParticipantService } from "./participant.service";
import { PartyService } from "./party.service";
import { Course, Participant, Party, Prisma } from "@prisma/client";
import { tag } from "../dto/create-course.dto";
import { Injectable } from '@nestjs/common';

@Injectable()
export class GuestService {
    constructor(
        private otpService:OtpService,
        private kakaoService:KakaoService,
        private mapService:MapService,
    ) {}

    private toPartyModel(dto: PartyInfoGuestDto): Party {
        return {
            party_id: randomUUID(),        // 게스트는 party_id 없음 → 생성
            party_name: dto.party_name,         // DTO의 party_name → title로 매핑
            party_type: 'AI_COURSE',
            date_time: dto.date_time,
            party_state:true,
            mid_lat:dto.mid_lat ? new Prisma.Decimal(dto.mid_lat) : new Prisma.Decimal(0),
            mid_lng:dto.mid_lng ? new Prisma.Decimal(dto.mid_lng) : new Prisma.Decimal(0),
            mid_place:dto.mid_place,
            participant_count:0,
        } as Party;
    }

    // --- 2) Participant 변환 ---
    private async toParticipantModel( dto: ParticipantGuestDto, party_id: string): Promise<Participant> {
        let lat = null;
        let lng = null;

        // 주소 있을 때만 좌표 변환
        if (dto.start_address) {
            const coord = await this.mapService.getCoordinates(dto.start_address);
            lat = coord.lat;
            lng = coord.lng;
        }
        return {
            participant_id: randomUUID(),  // 게스트 참여자 id 생성
            party_id,
            user_uid: dto.participant_name,                  // 게스트는 사용자 uid 없음
            participant_name: dto.participant_name, // 필요하면 저장
            start_address: dto.start_address,
            code: null,  
            start_lat: lat,
            start_lng: lng,
            transport_mode: dto.transport_mode,
            role: 'MEMBER',
        } as Participant;
    }

    // --- 3) Course 변환 ---
    private toCourseModel(dto: CourseGuestDto, party_id: string): Course {
        return {
            course_id: dto.course_id,
            party_id,
            course_no: dto.course_no,                  // 게스트는 번호 없음 → 1로 고정 or index
            tag: dto.tag as unknown as Prisma.JsonValue,                  // 태그 그대로 전달

            place_name: dto.place_name,              // Kakao가 찾아줌
            place_lat: dto.place_lat ? new Prisma.Decimal(dto.place_lat) : new Prisma.Decimal(0),
            place_lng: dto.place_lng ? new Prisma.Decimal(dto.place_lng) : new Prisma.Decimal(0),
            place_address: dto.place_address,
            course_view: true,
        } as Course;
    }

    async guestParty(dto: GuestDto) {   
        const party = this.toPartyModel(dto.party);

        // Participant 변환 (주소 → 좌표 변환 포함)
        const participants = await Promise.all(
            dto.participants.map((p) =>
                this.toParticipantModel(p, party.party_id),
            ),
        );

        // Course 변환
        const courses = dto.courses.map((c) =>
            this.toCourseModel(c, party.party_id),
        );


        const midpoint = await this.otpService.getCrossMid(party,participants);

        const arr = await this.kakaoService.findAICoursePlaces(courses, midpoint.lat, midpoint.lng);

        const convertName = [
            '거리우선 추천코스',
            '인기우선 추천코스',
            'AI추천 코스',
        ];

        // 각 추천 유형을 course 단위로 묶기
        const list = [
            {
            courseId: Math.floor(100000 + Math.random() * 900000).toString(),
            courseNo: 1,
            courseName: convertName[0],
            places: arr.distance.map((l) => ({
                placeId: l.course_id,
                placeName: l.place.place_name,
                placeAddr: l.place.address_name,
                lat: Number(l.place.y),
                lng: Number(l.place.x),
            })),
            },
            {
            courseId: Math.floor(100000 + Math.random() * 900000).toString(),
            courseNo: 2,
            courseName: convertName[1],
            places: arr.accuracy.map((l) => ({
                placeId: l.course_id,
                placeName: l.place.place_name,
                placeAddr: l.place.address_name,
                lat: Number(l.place.y),
                lng: Number(l.place.x),
            })),
            },
            {
            courseId: Math.floor(100000 + Math.random() * 900000).toString(),
            courseNo: 3,
            courseName: convertName[2],
            places: arr.diversity.map((l) => ({
                placeId: l.course_id,
                placeName: l.place.place_name,
                placeAddr: l.place.address_name,
                lat: Number(l.place.y),
                lng: Number(l.place.x),
            })),
            },
        ];

        // 최종 반환 데이터
        const data = {
            party: {
            partyName: party.party_name,
            partyDate: party.date_time,
            midPoint: midpoint.name,
            midPointLat: midpoint.lat,
            midPointLng: midpoint.lng,
            partyType: party.party_type,
            courses: courses.map((c) => ({
                courseNo: c.course_no,
                courseId: c.course_id,
                places: {
                placeId: '',
                placeName: c.place_name ?? '',
                placeAddr: c.place_address ?? '',
                lat: c.place_lat ?? 0,
                lng: c.place_lng ?? 0,
                },
            })),
            },
            list,  // ⬅ 배열 형태로 반환됨
        };

        return data;
    }

    async guestResult(dto: GuestDto){
        const party = this.toPartyModel(dto.party);
        const participants = await Promise.all(
            dto.participants.map((p) =>
                this.toParticipantModel(p, party.party_id),
            ),
        );        
        const courses = await Promise.all(
            dto.courses.map((c) =>
                this.toCourseModel(c, party.party_id),
            ),
        );        
        const members = await Promise.all(
            participants.map(async (p) => {
                const from = `${p.start_lat},${p.start_lng}`;
                const to = `${courses[0].place_lat},${courses[0].place_lng}`;
                const mode = p.transport_mode || 'PUBLIC';
                const date_time = `${party.date_time}`;
    
                const route = await this.otpService.getRoute(from, to, mode, date_time);
                const sec = route?.plan?.itineraries[0]?.duration || 0;
                const min = Math.floor(sec / 60);
                const hour = Math.floor(min / 60);
                
                const fastest = route.plan.itineraries.reduce((a, b) => a.duration < b.duration ? a : b );

                const formattedLegs = this.formatLegs(fastest.legs);
                //console.log(route.plan.itineraries[0].legs);
                return {
                    name: p.user_uid,
                    startAddr: p.start_address,
                    transportMode: p.transport_mode,
                    routeDetail: {
                        totalTime: `${hour}시간 ${min % 60}분`,
                        routeSteps:[ `${route.plan.itineraries[0].transfers}번 환승`
                                    , ...formattedLegs],
                        startLat: p.start_lat,
                        startLng: p.start_lng,
                    },
                };
            }),
        );

        // 1-2) 반환
        return {
            role: '',
            party: {
                partyName: party.party_name,
                partyDate: party.date_time,
                midPoint: party.mid_place,
                midPointLat: party.mid_lat,
                midPointLng: party.mid_lng,
                courses: courses.map((c) => ({
                courseId: c.course_id,
                courseNo: c.course_no,
                places: {
                    placeId: '',
                    placeName: c.place_name,
                    placeAddr: c.place_address,
                    lat: c.place_lat,
                    lng: c.place_lng,
                },
                })),
            },
            member: members,
        }
    }
    private formatLegs(legs: any[]) {
        return legs.map((leg, idx) => {
            const n = idx + 1;
            const from = leg.from.name;
            const to = leg.to.name;
            const dist = Math.round(leg.distance);
            const min = Math.round(leg.duration / 60);

            // ---- 교통수단 이름 매핑 ----
            const routeType = leg.routeType;
            const routeShortName = leg.routeShortName || leg.route || "";

            const modeName = !leg.transitLeg
            ? "WALK"
            : routeType === 3
            ? "BUS"
            : routeType === 1
            ? "SUBWAY"
            : routeType === 0
            ? "TRAM"
            : routeType === 2
            ? "RAIL"
            : "TRANSIT";

            // ---- WALK ----
            if (!leg.transitLeg) {
            return `Leg ${n}: WALK (${from} → ${to})\n거리 ${dist}m\n약 ${min}분`;
            }

            // ---- TRANSIT ----
            return `Leg ${n}: ${modeName} ${routeShortName}\n${from} → ${to}`;
        });
    }

}    