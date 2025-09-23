import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsEmail()
    email?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsPhoneNumber()
    @IsOptional()
    phone?: string;
}