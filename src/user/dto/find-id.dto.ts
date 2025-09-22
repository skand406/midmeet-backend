import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class FindIdDto {
    // @ApiProperty({
    //     description: '사용자 이름',
    //     example: '김철수',
    // })
    // @IsString()
    // name: string;

    @ApiProperty({
        description: '사용자 이메일',
        example: 'user1234@example.com',
    })
    @IsEmail()
    email: string;
}