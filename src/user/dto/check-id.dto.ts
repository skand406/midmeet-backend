import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class CheckIdDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 'user1234',
  })
  @IsString()
  //@Matches(/^[a-z0-9_]{4,20}$/i, { message: 'ID는 4~20자 영문/숫자/_만 허용' })
  id: string;
}
