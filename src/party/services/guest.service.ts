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
            mid_lat:new Prisma.Decimal(0),
            mid_lng:new Prisma.Decimal(0),
            mid_place:'서울역',
            participant_count:0,
        } as Party;
    }

    // --- 2) Participant 변환 ---
    private async toParticipantModel( dto: ParticipantGuestDto, party_id: string): Promise<Participant> {
        const { lng, lat } = await this.mapService.getCoordinates(dto.start_address);

        return {
            participant_id: randomUUID(),  // 게스트 참여자 id 생성
            party_id,
            user_uid: '',                  // 게스트는 사용자 uid 없음
            participant_name: dto.participant_name, // 필요하면 저장
            start_address: dto.start_address,
            code: null,  // ✨ 반드시 포함
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

            place_name: null,              // Kakao가 찾아줌
            place_lat: null,
            place_lng: null,
            place_address: null,
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

        return await this.kakaoService.findAICoursePlaces(courses, midpoint.lat, midpoint.lng);

    }
}    