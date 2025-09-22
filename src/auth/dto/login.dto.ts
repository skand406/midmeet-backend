import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
      description: '사용자 아이디 ',
      example: 'user',})
  @IsString()
  id: string;

  @ApiProperty({
    description: '사용자 비밀번호',
    example: 'test1234',})
  @IsString()
  passwd: string;
}
