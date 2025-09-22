import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자 이메일 주소',
    example: 'user@example.com',})
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '사용자 비밀번호 : 최소 8자',
    example: 'test1234',})
  @IsNotEmpty()
  @MinLength(8)
  passwd: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '김철수',})
  @IsOptional()
  @IsString()
  name?: string;
    
  @ApiProperty({
    description: '사용자 전화번호 :국제 표준(+82...)',
    example: 'user@example.com',})
  @IsPhoneNumber() 
  @IsString()
  phone?: string;

  @ApiProperty({
    description: '사용자 아이디 ',
    example: 'user',})
  @IsOptional()
  @IsString()
  id: string; 

}
