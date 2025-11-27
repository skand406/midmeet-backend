import { Injectable, NotFoundException } from '@nestjs/common';
import { PartyService } from '../party/party.service';
import { ParticipantService } from '../participant/participant.service';
import { CourseService } from '../course/course.service';
import { CommonService } from '../common/common.service';
import { User } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class ResultService {
    guestService: any;
    constructor(
        private partyService: PartyService,
        private courseService: CourseService,
        private participantService: ParticipantService,
        private commonService: CommonService,
        private userService: UserService,
        private otpService: OtpService
    ) {}

    async getResult(party_id: string, uid: string) {
        const party = await this.partyService.readParty(party_id);
        const course_list = await this.courseService.readCourseList(party_id);
        const participant = await this.participantService.findOne(uid, party_id);
        if (!party || !course_list || !participant) throw new NotFoundException('모임이 없습니다.');

        /* ------------------------------
            1) 코스 가공 
        ------------------------------ */
        const courses = await Promise.all(
            course_list.map(async (c) => ({
                courseId: c.course_id,
                courseNo: c.course_no,
                places: {
                    placeId: '',
                    placeName: c.place_name,
                    placeAddr: c.place_address,
                    lat: c.place_lat,
                    lng: c.place_lng,
                    placeUrl: c.place_url,
                    imageUrl: await this.commonService.getPlaceImageUrl(c.place_url || ''),
                },
            }))
        );

        /* ------------------------------
            2) 공통 경로 생성 함수
        ------------------------------ */
        const buildRouteInfo = async (p) => {
            const from = `${p.start_lat},${p.start_lng}`;
            const to = `${course_list[0].place_lat},${course_list[0].place_lng}`;
            const mode = p.transport_mode || 'PUBLIC';
            const date_time = `${party.date_time}`;

            const route = await this.otpService.getRoute(from, to, mode, date_time);
            const user = await this.userService.findById(p.user_uid);

            if (route.plan.itineraries.length === 0) {
                return {
                    name: user?.name ?? '알수없음',
                    startAddr: p.start_address,
                    transportMode: p.transport_mode,
                    routeDetail: {
                        totalTime: '경로 없음',
                        routeSteps: [],
                        startLat: p.start_lat,
                        startLng: p.start_lng,
                    },
                };
            }
            else{
                const sec = route?.plan?.itineraries[0]?.duration || 0;
                const min = Math.floor(sec / 60);
                const hour = Math.floor(min / 60);
                const fastest = route.plan.itineraries.reduce((a, b) => (a.duration < b.duration ? a : b));
                const formattedLegs = this.commonService.formatLegs(fastest.legs);

                return {
                    name: user?.name ?? '알 수 없음',
                    startAddr: p.start_address,
                    transportMode: p.transport_mode,
                    routeDetail: {
                        totalTime: `${hour}시간 ${min % 60}분`,
                        routeSteps: [`${fastest.transfers}번 환승`, ...formattedLegs],
                        startLat: p.start_lat,
                        startLng: p.start_lng,
                    },
                };
            }   
        };

        /* ------------------------------
            3) LEADER → 모든 멤버 경로
        ------------------------------ */
        let members;
        if (participant.role === 'LEADER') {
            const list = await this.participantService.findMany(party_id);
            members = await Promise.all(list.map((p) => buildRouteInfo(p)));
        } else {
            /* ------------------------------
            4) MEMBER → 본인만
            ------------------------------ */
            members = [await buildRouteInfo(participant)];
        }

        /* ------------------------------
            5) 최종 반환
        ------------------------------ */
        return {
            role: participant.role,
            party: {
                partyName: party.party_name,
                partyDate: party.date_time,
                midPoint: party.mid_place,
                midPointLat: party.mid_lat,
                midPointLng: party.mid_lng,
                courses,
            },
            member: members,
        };
    }
    

}
