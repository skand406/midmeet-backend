import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PartyType } from '@prisma/client'; // Prisma enum import
import { IsBoolean, IsDateString, IsNotEmpty, isNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePartyDto {

    @IsOptional()
    @ApiPropertyOptional({ 
        enum: PartyType,
        description: '파티 유형',
        example: PartyType.AI_COURSE
    })
    party_type?: PartyType;

    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({
        description: '파티 상태 (진행중/종료)',
        example: true,
    })
    party_state?: boolean;

    @IsOptional()
    @IsDateString()
    @ApiPropertyOptional({
        description: '모임 날짜와 시간',
        example: '2025-10-10T14:00:00Z',
    })
    date_time?: Date;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({
        description: '파티 이름',
        example: '친구들 점심 모임',
    })
    party_name?: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({
        description: '중간장소 이름',
        example: '서울역',
    })
    mid_place?: string;
    
    @IsOptional()
    @IsNumber()
    @ApiPropertyOptional({
        description: '중간장소 경도',
        example: '126.9780',
    })
    mid_lng?: number;
    
    @IsOptional()
    @IsNumber()
    @ApiPropertyOptional({
        description: '중간장소 위도',
        example: '37.5665',
    })
    mid_lat?: number;
}
