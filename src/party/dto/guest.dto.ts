import { PartyType, TransportMode } from "@prisma/client";
import { IsDate, IsString, IsArray, ValidateNested, IsNotEmpty, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

// 🚨 1. 외부에서 정의된 tag 타입을 import 합니다. (예시: create-course.dto.ts)
// 이 파일은 'tag' 타입이 정의된 실제 경로로 대체해야 합니다.
// 'tag'가 클래스라면 아래처럼 정의합니다.
import { tag } from "./create-course.dto"; 

// --- 2. Party 정보 DTO ---
export class PartyInfoGuestDto {
    @IsDateString()
    @IsNotEmpty()
    date_time: Date;

    @IsString()
    @IsNotEmpty()
    party_name: string;


}

// --- 3. Participant 정보 DTO ---
export class ParticipantGuestDto {
    @IsString()
    @IsNotEmpty()
    participant_name: string;

    @IsEnum(TransportMode) // Prisma Enum 사용
    @IsNotEmpty()
    transport_mode: TransportMode;

    @IsString()
    @IsNotEmpty()
    start_address: string;
}

// --- 4. Courses 정보 DTO ---
export class CourseGuestDto {
    @IsString()
    @IsNotEmpty()
    course_id: string;
    
    @IsNumber()
    @IsNotEmpty()
    course_no: number;
    
    // 외부에서 정의된 Tag DTO 사용
    @ValidateNested()
    @Type(() => tag) // Tag DTO로 타입 변환
    @IsNotEmpty()
    tag: tag; // 이제 tag는 TagDto의 인스턴스가 됩니다.
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