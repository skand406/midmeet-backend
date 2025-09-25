import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 회원가입 + 자동 로그인(쿠키에 JWT 심기)
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: CreateUserDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.signup(dto);
    
    return { user, token }; // 토큰도 바디로 반환(모바일/SPA 용)
  }
 
  // 로그인
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.login(dto);
    
    return { user, token };
  }

  // 이메일 인증
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: '이메일 인증이 완료되었습니다.' };
  }

  // 쿠키 삭제 (로그아웃)

}
