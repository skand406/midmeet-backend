import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CheckIdDto } from './dto/check-id.dto';
import { ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FindIdDto } from './dto/find-id.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Req } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
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
  
  @UseGuards(JwtAuthGuard)
  @Get('user-info')
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT 토큰',
    required: true,
  })
  async getUserInfo(@Req() req) {
    const uid = req.user.uid; // JWT에서 추출된 값
    return  this.userService.getUserInfo(uid);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('user-info')
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT 토큰',
    required: true,
  })
  async updateUserInfo(@Req() req, @Body() body: UpdateUserDto) {
    const uid = req.user.uid; // JWT에서 추출된 값
    return this.userService.updateUser(uid, body);
  }
}
