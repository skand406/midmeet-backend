import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsString, ValidateNested } from "class-validator";

export class tag{
    @ApiProperty({ example: "FD6", description: "카카오 카테고리 코드" })
    @IsString()
    category: string;

    @ApiProperty({ example: ["한식", "일식"], description: "키워드 목록" })
    @IsArray()
    @IsString({ each: true })
    primaryQueries: string[];

    @ApiProperty({ example: ["주차", "단체"], description: "세컨더리 필터" })
    @IsArray()
    @IsString({ each: true })
    secondaryFilters: string[];
}

export class CreateCourseDto {
    @ApiProperty({ example: 1, description: '코스 번호' })
    @IsNumber()
    course_no: number;

    @ApiProperty({ example: 'tag1, tag2', description: '태그 집합' })
    @ValidateNested()
    @Type(() => tag)
    tag: tag;
}

export class CreateCourseArrayDto {
    map(arg0: (course: any) => { party_id: string; course_no: number; tag: any; }): any {
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