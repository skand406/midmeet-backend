import { GuestDto } from "../dto/guest.dto";
import { CourseService } from "./course.service";
import { KakaoService } from "./kakao.service";
import { MapService } from "./map.service";
import { OtpService } from "./otp.service";
import { ParticipantService } from "./participant.service";
import { PartyService } from "./party.service";


export class GuestService {
    constructor(
        private otpService:OtpService,
        private kakaoService:KakaoService,
        private mapService:MapService,
    ) {}
    async guestParty(dto: GuestDto) {   
        const party = dto.party;
        const courses = dto.courses;
        const participants = dto.participants;

        //const midpoint = this.otpService.getCrossMid();

        return ""//await this.kakaoService.findAICoursePlaces(courses, midpoint.lat,midpoint.lng);

    }
}    