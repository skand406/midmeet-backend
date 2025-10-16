import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsString, ValidateNested } from "class-validator";

export class CreateCourseDto {
    @ApiProperty({ example: 1, description: '코스 번호' })
    @IsNumber()
    course_no: number;

    @ApiProperty({ example: 'tag1, tag2', description: '태그 집합' })
    @IsString()
    tag: string;
}

export class CreateCourseArrayDto {
    map(arg0: (course: any) => { party_id: string; course_no: any; tag: any; }): any {
        throw new Error('Method not implemented.');
    }
    
    @ApiProperty({
        description: '코스 목록 배열',
        example: {
            courses: [
                { course_no: 1, tag: '#카페,#디저트,#조용한' },
                { course_no: 2, tag: '#맛집,#분위기,#조용한' },
            ],
        }
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCourseDto)
    courses: CreateCourseDto[];
}