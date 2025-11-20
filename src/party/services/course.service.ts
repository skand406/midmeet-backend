import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateCourseArrayDto } from '../dto/create-course.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  UpdateCourseArrayDto,
  UpdateCourseDto,
} from '../dto/update-course.dto';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  async createCourse(
    party_id: string,
    createCourseArrayDto: CreateCourseArrayDto,
  ) {
    const party = await this.prisma.party.findUnique({ where: { party_id } });
    if (!party) {
      throw new HttpException('존재하지 않는 모임입니다.', 405);
    }

    try {
      await this.prisma.course.createMany({
        data: createCourseArrayDto.courses.map((course) => ({
          party_id: party_id,
          course_no: course.course_no,
          tag: instanceToPlain(course.tag),
        })),
      });

      const courses = await this.prisma.course.findMany({
        where: { party_id },
      });
      return courses;
    } catch (e) {
      if (e.code === 'P2002') {
        throw new HttpException(
          '해당 모임에서 이미 존재하는 course_no 입니다.',
          409,
        );
      }
      throw e;
    }
  }

  async updateArrayCourse(
    party_id: string,
    updateCourseArrayDto: UpdateCourseArrayDto,
  ) {
    await this.prisma.$transaction(
      updateCourseArrayDto.courses.map((course) =>
        this.prisma.course.update({
          where: {
            course_id: course.course_id,
          },
          data: {
            place_address: course.place_address,
            place_name: course.place_name,
            place_lat: course.place_lat,
            place_lng: course.place_lng,
            course_view: course.course_view,
          },
        }),
      ),
    );
    return await this.prisma.course.findMany({
      where: { party_id },
    });
  }

  async updateCourse(
    party_id: string,
    course_id: string,
    updateCourse: UpdateCourseDto,
  ) {
    await this.prisma.course.update({
      where: { course_id },
      data: {
        place_address: updateCourse.place_address,
        place_name: updateCourse.place_name,
        course_view: updateCourse.course_view,
        course_no: updateCourse.course_no,
      },
    });
    return await this.prisma.course.findMany({
      where: { party_id },
    });
  }

  async readCourseList(party_id) {
    return await this.prisma.course.findMany({
      where: { party_id },
      orderBy: { course_no: 'asc' },
    });
  }
}
