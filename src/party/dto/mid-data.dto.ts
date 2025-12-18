import { ApiProperty } from '@nestjs/swagger';

export class MidCoursePlaceDto {
  @ApiProperty({ example: 121 })
  placeId: number;

  @ApiProperty({ example: '미정' })
  placeName: string;

  @ApiProperty({ example: '미정' })
  placeAddr: string;

  @ApiProperty({ example: 37.5048 })
  lat: number;

  @ApiProperty({ example: 127.0245 })
  lng: number;
}

export class MidCourseDto {
  @ApiProperty({ example: 1 })
  courseNo: number;

  @ApiProperty({ example: 'cmglvehl30007vpigz62q4lyi' })
  courseId: string;

  @ApiProperty({ type: MidCoursePlaceDto })
  places: MidCoursePlaceDto;
}

export class MidPartyDto {
  @ApiProperty({ example: '서울 강남 모임' })
  partyName: string;

  @ApiProperty({ example: '2025.11.30 오후 6시' })
  partyDate: string;

  @ApiProperty({ example: '서울특별시 강남구 신논현역' })
  midPoint: string;

  @ApiProperty({ example: 37.5048 })
  midPointLat: number;

  @ApiProperty({ example: 127.0245 })
  midPointLng: number;

  @ApiProperty({ type: [MidCourseDto] })
  courses: MidCourseDto[];
}

export class MidPageResponseDto {
  @ApiProperty({ type: MidPartyDto })
  party: MidPartyDto;
}
