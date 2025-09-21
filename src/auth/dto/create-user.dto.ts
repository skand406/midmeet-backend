import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  passwd: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsPhoneNumber()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  id: string; 

}
