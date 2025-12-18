import { PartyType, RoleType, TransportMode } from '@prisma/client';
import {
  IsDate,
  IsString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

// 🚨 1. 외부에서 정의된 tag 타입을 import 합니다. (예시: create-course.dto.ts)
// 이 파일은 'tag' 타입이 정의된 실제 경로로 대체해야 합니다.
// 'tag'가 클래스라면 아래처럼 정의합니다.
import { tag } from './create-course.dto';
// --- 2. Party 정보 DTO ---
export class PartyInfoGuestDto {
  @IsOptional()
  @IsString()
  party_id?: string;

  @IsOptional()
  @IsDateString()
  date_time?: Date;

  @IsOptional()
  @IsString()
  party_name?: string;

  @IsOptional()
  party_type?: PartyType;

  @IsOptional()
  party_strate?: boolean;

  @IsOptional()
  @IsNumber()
  participant_count?: number;

  @IsOptional()
  @IsNumber()
  mid_lat?: number;

  @IsOptional()
  @IsNumber()
  mid_lng?: number;

  @IsOptional()
  @IsString()
  mid_place?: string;
}

// --- 3. Participant 정보 DTO ---
export class ParticipantGuestDto {
  @IsOptional()
  @IsString()
  participant_id?: string;

  @IsOptional()
  @IsString()
  party_id?: string;

  @IsOptional()
  @IsString()
  participant_name?: string;

  @IsOptional()
  @IsEnum(TransportMode)
  transport_mode?: TransportMode;

  @IsOptional()
  role?: RoleType;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsNumber()
  start_lat?: number;

  @IsOptional()
  @IsNumber()
  start_lng?: number;

  @IsOptional()
  @IsString()
  start_address?: string;
}

// --- 4. Courses 정보 DTO ---
export class CourseGuestDto {
  @IsOptional()
  @IsString()
  course_id?: string;

  @IsOptional()
  @IsString()
  party_id?: string;

  @IsOptional()
  @IsString()
  place_name?: string;

  @IsOptional()
  @IsString()
  place_address?: string;

  @IsOptional()
  @IsNumber()
  course_no?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => tag)
  tag?: tag;

  @IsOptional()
  course_view?: boolean;

  @IsOptional()
  @IsNumber()
  place_lat?: number;

  @IsOptional()
  @IsNumber()
  place_lng?: number;

  @IsOptional()
  @IsString()
  place_url?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

// --- 5. 메인 Guest DTO ---
export class GuestDto {
  // 1. Party 정보 (단일 객체)
  @ValidateNested()
  @Type(() => PartyInfoGuestDto)
  @IsNotEmpty()
  party: PartyInfoGuestDto;

  // 2. Participant 정보 (배열)
  @IsArray()
  @ValidateNested({ each: true }) // 배열의 각 요소 검사
  @Type(() => ParticipantGuestDto)
  @IsNotEmpty()
  participants: ParticipantGuestDto[];

  // 3. Courses 정보 (배열)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseGuestDto)
  @IsNotEmpty()
  courses: CourseGuestDto[];
}
