import { IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePartyDto {
    @ApiProperty({ example: '2023-12-31T18:30:00Z', description: '모임 날짜/시간 (ISO 8601 형식)' })
    @IsDateString()
    date_time: string;   // 모임 날짜/시간

    @ApiProperty({ example: 'New Year Party', description: '모임 이름' })           
    @IsString()
    party_name: string;  // 모임 이름

    @ApiProperty({ example: 5, description: '인원 수', minimum: 2, maximum:10 })
    @IsInt()
    @Min(2)
    @Max(10)
    participant_count: number;  // 인원 수
}
