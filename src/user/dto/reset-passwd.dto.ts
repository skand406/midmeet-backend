import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class ResetPasswdDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 'user1234',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user1234@example.com',
  })
  @IsEmail()
  email: string;
}
