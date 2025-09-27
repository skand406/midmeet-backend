import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
    @ApiProperty({
        description: '사용자 이메일',
        example: 'user1234@example.com',
    })
    @IsEmail()
    email?: string;

    @ApiProperty({
        description: '사용자 이름',
        example: '홍길동',
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        description: '사용자 전화번호',
        example: '+821012341234',
    })
    @IsPhoneNumber()
    @IsOptional()
    phone?: string;
}