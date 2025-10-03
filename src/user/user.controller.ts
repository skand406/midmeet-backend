import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, NotFoundException, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { CheckIdDto } from './dto/check-id.dto';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FindIdDto } from './dto/find-id.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Req } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswdDto } from './dto/change-passwd.dto';
import { ResetPasswdDto } from './dto/reset-passwd.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  // ID 중복 확인
  @HttpCode(HttpStatus.OK)
  @Get('check-id')
  @ApiQuery({ 
    name: 'id', 
    type: 'string',
    description: '확인할 사용자 ID',
    example: 'test_id123'
  })
  async checkId(@Query() q: CheckIdDto) {
    return this.userService.isCheckIdAvailable(q.id);
  }

  // ID 찾기 (이메일로)
  @HttpCode(HttpStatus.OK)
  @Get('find-id')
  @ApiQuery({ 
    name: 'email', 
    type: 'string',
    description: '알고 싶은 id의 사용자 이메일',
    example: 'test_id123@example.com'
  })
  async findId(@Query() q: FindIdDto) {
    return this.userService.findId(q.email);
  }

  // 사용자 정보 조회 
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('user-info')
  @ApiBearerAuth()
  async getUserInfo(@Req() req) {
    const uid = req.user.uid; // JWT에서 추출된 값
    return  this.userService.getUserInfo(uid);
  }
  
  // 사용자 정보 수정 (이메일 인증된 사용자만 가능)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('user-info')
  @ApiBearerAuth()
  async updateUserInfo(@Req() req, @Body() body: UpdateUserDto) {
    const uid = req.user.uid; // JWT에서 추출된 값
    const user = await this.userService.findById(uid);
    
    if (!user) {
      throw new NotFoundException('해당 사용자가 존재하지 않습니다.');
    }
    if (!user.isVerified) {
      throw new ForbiddenException('이메일 인증 후에만 정보 수정이 가능합니다.');
    }
    if (user.isVerified && user.email !== body.email) {
      throw new ForbiddenException('이메일 인증이 필요합니다.');
    }

    return this.userService.updateUser(uid, body);
  }

  // 이메일 변경 요청 (이메일 인증된 사용자만 가능)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('change-email')
  @ApiBearerAuth()
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'user1234@example.com',
        },
      },
    },
    description: '변경할 새로운 이메일 주소',
  })
  async requestEmailChange(@Req() req, @Body('email') email: string) {
    const uid = req.user.uid;

    return this.userService.requestEmailChange(uid, email);
  }

  // 비밀번호 재설정 요청 (이메일 인증된 사용자만 가능)
  @Post('reset-password')
  @ApiBody({ 
    type: ResetPasswdDto,
    description: '비밀번호 재설정을 위한 사용자 정보',
  })
  async resetPassword(@Body() body: ResetPasswdDto){

    return this.userService.requestPasswordChange(body);  
  }

  // 비밀번호 변경 (현재 비밀번호 + 새 비밀번호) - 로그인된 사용자만 가능
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('change-password')
  @ApiBearerAuth()
  @ApiBody({ 
    type: ChangePasswdDto,
    description: '비밀번호 변경을 위한 현재 비밀번호 및 새 비밀번호',
  })
  async changePassword(@Req() req,@Body() body: ChangePasswdDto,) {
    const uid = req.user.uid; // JWT에서 유저 UID 추출

    return this.userService.changePassword(uid, body.current_passwd, body.new_passwd);
  }
  

  // 회원 탈퇴
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('delete-user')
  @ApiBearerAuth()
  async deleteAccount(@Req() req) {
    const uid = req.user.uid; // JWT에서 유저 UID 추출

    return this.userService.deleteAccount(uid);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('visits')
  @ApiBearerAuth()
  async getUserVisits(@Req() req){
    const uid =req.user.uid;

    return this.userService.getUserVisits(uid);
  }
}