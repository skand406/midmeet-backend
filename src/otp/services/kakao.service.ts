import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseService } from 'src/party/services/course.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OtpService } from './otp.service';
import { NotFoundError } from 'rxjs';
import { tag } from 'src/party/dto/create-course.dto';

@Injectable()
export class KakaoService {

    constructor(
        private readonly httpService: HttpService,
        private prisma: PrismaService,
        private otpService:OtpService
    ) {}

async kakaoSearch(keyword: string, lat: number, lng: number, radius: number,code:string) {
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
      sort:'distance'
    }

  });
  console.log(url);
  return res.data.documents;
}

  async findCourseList(party_id:string,course_no:number, lat:number, lng:number){
    const course = await this.prisma.course.findUnique({ where:{party_id_course_no:{party_id,course_no}}});
    if(!course) throw new NotFoundException('코스가 존재하지 않습니다.');

    const tag = course.tag as unknown as tag;
  

    return tag.category;
  }
}
