import { ApiProperty, PartialType } from '@nestjs/swagger';
import { PartyType } from '@prisma/client'; // Prisma enum import
import { IsNotEmpty, isNotEmpty, IsString } from 'class-validator';

export class UpdatePartyDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ 
        description: '파티 ID', 
        example: 'cmg3qqvk30003vpg05lgpb1tb' 
    })
    party_id: string;


    @IsNotEmpty()
    @ApiProperty({ 
        enum: PartyType,
        description: '파티 유형',
        example: PartyType.AI_COURSE
    })
    party_type: PartyType;
}
