import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,) {}


  // 회원가입 + 자동 로그인(쿠키에 JWT 심기)
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ 
    type: CreateUserDto, 
    description: '회원가입 정보', 
  })
  @ApiResponse({ 
    status: 500, 
    description: '서버 내부 오류 (DB 문제 등)', 
    schema: { 
      example: { 
        statusCode: 500, 
        error: 'Internal Server Error' 
      } 
    }
  })
  async signup(@Body() dto: CreateUserDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.signup(dto);
    
    return { user, token }; // 토큰도 바디로 반환(모바일/SPA 용)
  }
 
  // 로그인
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ 
    type: LoginDto, 
    description: '로그인 정보', 
  })
  @ApiResponse({ 
    status: 401, 
    description: '비밀번호가 다름', 
    schema: { 
      example: { 
        statusCode: 401, 
        error: 'Unauthorized' ,
        message: 'passwd-Invalid credentials'
      } 
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: '존재하는 id가 없음', 
    schema: { 
      example: { 
        statusCode: 401, 
        error: 'Unauthorized' ,
        message: 'id-Invalid credentials'
      } 
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: '서버 내부 오류 (DB 문제 등)', 
    schema: { 
      example: { 
        statusCode: 500, 
        error: 'Internal Server Error' 
      } 
    }
  })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.login(dto);
    
    return { user, token };
  }

  // 이메일 인증
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'token',
    type: 'string',
    description: '이메일 인증 토큰',
    example: 'd1f2e3c4b5a697887766554433221100',
    required: true,
  })
  @ApiResponse({ 
    status: 500, 
    description: '서버 내부 오류 (DB 문제 등)', 
    schema: { 
      example: { 
        statusCode: 500, 
        error: 'Internal Server Error' 
      } 
    }
  })
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    await this.authService.verify(token,'EMAIL');

    return res.redirect(`${process.env.FRONT_URL}/signup/success/completed`); // 인증 성공 페이지로 리다이렉트
  }

  // 비밀번호 재설정 이메일 인증
  @Post('verify-reset')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ 
    name: 'token', 
    type: 'string',
    description: '비밀번호 재설정 토큰',
    example: 'd1f2e3c4b5a697887766554433221100',
    required: true,
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        passwd: {
          type: 'string',
          example: 'new_password123',
        },
      },
    },
    description: '새 비밀번호',
    required: true,
  })
  @ApiResponse({  
    status: 400, 
    description: '새로운 비밀번호가 입력되지 않았을 경우', 
    schema: { 
      example: { 
        statusCode: 400, 
        message: '새 비밀번호가 제공되지 않았습니다.' 
      } 
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: '서버 내부 오류 (DB 문제 등)', 
    schema: { 
      example: { 
        statusCode: 500, 
        error: 'Internal Server Error' 
      } 
    }
  })
  async verifyReset(@Query('token') token: string, @Body('passwd') passwd: string, @Res() res: Response) {
    await this.authService.verify(token, 'RESET', passwd);
    return res.redirect(`${process.env.FRONT_URL}/reset-passwd/success`)
  }

}
