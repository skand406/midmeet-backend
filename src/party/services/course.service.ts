import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateCourseArrayDto } from '../dto/create-course.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCourseArrayDto, UpdateCourseDto } from '../dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  async createCourse(party_id: string, createCourseArrayDto: CreateCourseArrayDto) {
    const party = await this.prisma.party.findUnique({where: {party_id}});
    if(!party){
        throw new HttpException('존재하지 않는 모임입니다.', 405);
    }   
 
    try{
      await this.prisma.course.createMany({
        data: createCourseArrayDto.courses.map(course => ({
          party_id: party_id,
          course_no: course.course_no,
          tag: course.tag,
        })),
      });

      const courses = await this.prisma.course.findMany({
        where: { party_id },
      });
    return courses;

    } catch (e) {
      if (e.code === 'P2002') {
        throw new HttpException('해당 모임에서 이미 존재하는 course_no 입니다.', 409);
      }
    throw e;
    }
  }

  async updateArrayCourse(party_id:string, updateCourseArrayDto:UpdateCourseArrayDto){

    await this.prisma.$transaction(
      updateCourseArrayDto.courses.map((course) =>
        this.prisma.course.update({
          where: {
            party_id_course_no:{party_id,course_no:course.course_no}
          },
          data: {
            place_address: course.place_address,
            place_name: course.place_name,
            course_view: course.course_view,
          },
        }),
      ),
    );
    return await this.prisma.course.findMany({
      where:{party_id}
    })
  }

  async updateCourse(party_id:string, course_id:string, updateCourse:UpdateCourseDto){
    
    await this.prisma.course.update({
      where:{course_id},
      data:{
        place_address:updateCourse.place_address,
        place_name:updateCourse.place_name,
        course_view:updateCourse.course_view
      }
    });
    return await this.prisma.course.findMany({
      where:{party_id}
    })
  }

  async findCourseList(party_id:string){
    const course_list = await this.prisma.course.findMany({where:{party_id}});
    
  }
}
