import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, IsString, ValidateNested } from "class-validator";

export class UpdateCourseDto{


    @ApiProperty({
        example:'신부산갈매기',
        description:'장소 이름(상호명)'
    })
    @IsString()
    place_name:string;

    @ApiProperty({
        example:'인천 연수구 학나래로6번길 35 1층 신부산갈매기',
        description:'장소의 주소(도로명주소)'
    })
    @IsString()
    place_address:string;

    @ApiProperty({
        example:1,
        description:'코스 순서'
    })
    @IsNumber()
    course_no:number;

    @ApiProperty({
        example:true,
        description:'코스가 보이고 안보이고 상태를 표시[true/false]'
    })
    @IsBoolean()
    course_view:boolean;
}

export class UpdateCourseArrayDto{
    map(arg0: (course: any) => {course_id:string; place_name:any; place_address:any; course_view:any;}): any{
        throw new Error('Method not implemented.');
    }

    @ApiProperty({
        description:'코스 목록 배열',
        example: {
            courses: [
                {   
                    course_no:1,
                    place_address: '인천 연수구 학나래로6번길 35 1층 신부산갈매기',
                    place_name: '신부산갈매기',
                    course_view: true 
                },
            ],
        }
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateCourseDto)
    courses: UpdateCourseDto[];
    
}