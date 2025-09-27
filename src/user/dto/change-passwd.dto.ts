import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChangePasswdDto {
    @ApiProperty({
        description: '사용자의 기존 비밀번호',
        example: 'user1234',
    })
    @IsString()
    current_passwd: string;

    @ApiProperty({
        description: '사용자의 새로운 비밀번호',
        example: 'newuser1234',
    })
    @IsString()
    new_passwd: string;
}