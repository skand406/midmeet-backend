import { ApiOAuth2, ApiProperty } from "@nestjs/swagger";
import { RoleType, TransportMode } from "@prisma/client";
import { Type } from "class-transformer";
import { isEnum, IsEnum, IsNumber, IsString } from "class-validator";

export class createParticipantDto{

    @ApiProperty({
        description:' 이동 수단 선택 (버스 및 자동차)',
        example: 'BUS'
    })
    @IsEnum(TransportMode)
    transport_mode : TransportMode;

    @ApiProperty({
        description: '사용자 역할',
        example: 'LEADER'
    })
    @IsEnum(RoleType)
    role : RoleType;
    
    @ApiProperty({
        description: '출발지의 위도',
        example: '37.450354677762'
    })
    @Type(() => Number)
    @IsNumber()
    start_lat : number;

    @ApiProperty({
        description: '출발지의 경도',
        example: '126.65915614333'
    })
    @Type(() => Number)
    @IsNumber()
    start_lng : number;

    @ApiProperty({
        description: '출발지 한글 주소',
        example: '인천광역시 미추홀구 인하로 100'
    })
    @IsString()
    start_address : string;
    
}