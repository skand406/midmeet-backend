import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UpdateCourseDto {
  @ApiProperty({
    example: 'cmgkrqffg0003p564vokrg7ql',
    description: '코스id',
  })
  @IsString()
  course_id: string;

  @ApiProperty({
    example: '신부산갈매기',
    description: '장소 이름(상호명)',
  })
  @IsString()
  @IsOptional()
  place_name?: string;

  @ApiProperty({
    example: '인천 연수구 학나래로6번길 35 1층 신부산갈매기',
    description: '장소의 주소(도로명주소)',
  })
  @IsString()
  @IsOptional()
  place_address?: string;

  @ApiProperty({
    example: 1,
    description: '코스 순서',
  })
  @IsNumber()
  course_no: number;

  @ApiProperty({
    example: true,
    description: '코스가 보이고 안보이고 상태를 표시[true/false]',
  })
  @IsBoolean()
  @IsOptional()
  course_view?: boolean;

  @ApiProperty({
    example: '37.450354677762',
    description: '장소의 위도',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  place_lat?: number;

  @ApiProperty({
    example: '126.65915614333',
    description: '장소의 경도',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  place_lng?: number;

  @ApiProperty({
    example: 'http://place.map.kakao.com/12345678',
    description: '장소 상세 URL',
  })
  @IsString()
  @IsOptional()
  place_url?: string;
}

export class UpdateCourseArrayDto {
  map(
    arg0: (course: any) => {
      party_id: string;
      course_no: number;
      place_name: any;
      place_address: any;
      course_view: any;
      place_lat: number;
      place_lng: number;
      place_url: string;
    },
  ): any {
    throw new Error('Method not implemented.');
  }

  @ApiProperty({
    description: '코스 목록 배열',
    example: [
        {
          course_no: 1,
          place_address: '인천 연수구 학나래로6번길 35 1층 신부산갈매기',
          place_name: '신부산갈매기',
          course_view: true,
          place_lat: 37.450354677762,
          place_lng: 126.65915614333,
          place_url: 'http://place.map.kakao.com/12345678', 
        },
      ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCourseDto)
  courses: UpdateCourseDto[];
}
