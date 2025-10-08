import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, UseGuards, HttpCode, HttpStatus, NotFoundException, Query } from '@nestjs/common';
import { PartyService } from './services/party.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { ParticipantService } from 'src/party/services/participant.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';
import { CreateCourseArrayDto } from './dto/create-course.dto';
import { CourseService } from './services/course.service';
import { STATUS_CODES } from 'http';
import { createParticipantDto } from './dto/create-participant.dto';
import { JwtService } from '@nestjs/jwt';
import { error } from 'console';

@Controller('party')
export class PartyController {
  constructor(
    private partyService: PartyService,
    private participantService: ParticipantService,
    private userService: UserService,
    private courseService: CourseService,
    private jwtService: JwtService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':party_id/invite')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
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
  generateInviteToken(@Param() party_id: string) {
    const payload = {
      party_id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7일 유효
    };

    const token = this.jwtService.sign(payload, {
      secret: process.env.INVITE_SECRET,
    });

    return {
      token: token,
      expires_in: '7일',
    };
  }


  @ApiOperation({
    summary: '모임 생성',
    description: 'JWT 인증된 사용자가 새로운 모임을 생성합니다. 이메일 인증 완료된 사용자만 가능.',
  })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @ApiBearerAuth()
  @ApiBody({ 
    type: CreatePartyDto,
    description: "모임 생서에 필요한 정보"
  })
  @ApiResponse({
    status: 201,
    description: '모임 생성 성공',
    schema: {
      example: {
        message: '모임이 생성되었습니다.',
        party_id: 'cmg3qqvk',
      },
    },
  })
  @ApiResponse({ 
    status: 403, 
    description: '이메일 인증이 완료되지 않음', 
    schema: { 
      example: { 
        statusCode: 403, 
        message: '이메일 인증 후 사용이 가능합니다.', 
        error: 'Forbidden' 
      } 
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '사용자 정보 없음', 
    schema: { 
      example: { 
        statusCode: 404, 
        message: '유효하지 않은 사용자입니다.', 
        error: 'Not Found' 
      } 
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'JWT 토큰 오류', 
    schema: { 
      example: { 
        statusCode: 401, 
        error: 'Unauthorized' 
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
  async createParty(@Req() req, @Body() createPartyDto: CreatePartyDto) {
    const uid = req.user.uid; // JWT에서 유저 추출
    const user = await this.userService.findById(uid);
    if(!user){
      throw new NotFoundException('유효하지 않은 사용자입니다.');
    }
    if(!user.isVerified){
      throw new ForbiddenException('이메일 인증 후 사용이 가능합니다.');
    }

    const party = await this.partyService.createParty(createPartyDto);

    return {
      "message": "모임이 생성되었습니다.",
      "party_id": party.party_id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch(':party_id')
  @ApiBearerAuth()
  @ApiParam({ 
    name: 'party_id', 
    required: true, 
    description: '모임 ID' 
  })
  @ApiBody({
    type: UpdatePartyDto,
    description: "모임 설정 변경에 필요한 정보",
  })
  @ApiResponse({ 
    status: 403, 
    description: '이메일 인증이 완료되지 않음', 
    schema: { 
      example: { 
        statusCode: 403, 
        message: '이메일 인증 후 사용이 가능합니다.', 
        error: 'Forbidden' 
      } 
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '사용자 정보 없음', 
    schema: { 
      example: { 
        statusCode: 404, 
        message: '유효하지 않은 사용자입니다.', 
        error: 'Not Found' 
      } 
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'JWT 토큰 오류', 
    schema: { 
      example: { 
        statusCode: 401, 
        error: 'Unauthorized' 
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
  async updateParty(@Req() req, @Body() updatePartyDto: UpdatePartyDto, @Param('party_id') party_id: string) {
    const uid = req.user.uid; // JWT에서 유저 추출
    const user = await this.userService.findById(uid);
    if(!user){
      throw new NotFoundException('유효하지 않은 사용자입니다.');
    }
    if(!user.isVerified){
      throw new ForbiddenException('이메일 인증 후 사용이 가능합니다.');
    }
    return await this.partyService.updatePartyType(updatePartyDto, party_id);
    
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post(':party_id/course')
  @ApiBearerAuth()
  @ApiParam({ 
    name: 'party_id', 
    required: true, 
    description: '모임 ID' 
  })
  @ApiBody({
    type: CreateCourseArrayDto,
    description: "모임에 추가할 코스 정보(순서 및 검색 태그)",
  })
  @ApiResponse({ 
    status: 403, 
    description: '이메일 인증이 완료되지 않음', 
    schema: { 
      example: { 
        statusCode: 403, 
        message: '이메일 인증 후 사용이 가능합니다.', 
        error: 'Forbidden' 
      } 
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '사용자 정보 없음', 
    schema: { 
      example: { 
        statusCode: 404, 
        message: '유효하지 않은 사용자입니다.', 
        error: 'Not Found' 
      } 
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'JWT 토큰 오류', 
    schema: { 
      example: { 
        statusCode: 401, 
        error: 'Unauthorized' 
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
  @ApiResponse({ 
    status: 405, 
    description: '파티가 존재하지 않는 경우', 
    schema: { 
      example: { 
        statusCode: 405, 
        message: '존재하지 않는 모임입니다.' 
      } 
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: '코드 번호가 겹칠 경우', 
    schema: { 
      example: { 
        statusCode: 409, 
        message: "해당 모임에서 이미 존재하는 course_no 입니다."
      } 
    }
  })
  async createCourse(@Req() req, @Body() createCourseArrayDto: CreateCourseArrayDto, @Param('party_id') party_id: string) {
    const uid = req.user.uid; // JWT에서 유저 추출
    const user = await this.userService.findById(uid);
    if(!user){
      throw new NotFoundException('유효하지 않은 사용자입니다.');
    }
    if(!user.isVerified){
      throw new ForbiddenException('이메일 인증 후 사용이 가능합니다.');
    }
      
    return await this.courseService.createCourse(party_id, createCourseArrayDto);
  }

  // findAll() {
  //   return this.partyService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.partyService.findOne(+id);
  // }


  @Delete(':party_id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiParam({
    name : 'party_id',
    required : true,
    description: '모임 id'
  })
  @ApiResponse({
    status: 406,
    description: 'role이 member인 사용자 : 삭제 권한이 없는 유저',
    schema: {
      example: {
        statusCode: 406,
        message : '삭제 권한이 없는 유저입니다.'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '참여자 정보 없음', 
    schema: { 
      example: { 
        statusCode: 404, 
        message: '참여 정보를 찾을 수 없습니다.', 
        error: 'Not Found' 
      } 
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'JWT 토큰 오류', 
    schema: { 
      example: { 
        statusCode: 401, 
        error: 'Unauthorized' 
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
  remove(@Req() req, @Param('party_id') party_id: string) {
    const uid = req.user.uid;
    return this.partyService.remove(party_id, uid)
  }


  @Post(':party_id/participant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)  
  @ApiParam({
    name : 'party_id',
    required: true,
    description: '모임 id'
  })
  @ApiBody({
    type: createParticipantDto,
    description: "모임에 참여하는 사람들 초대",
  })
  @ApiResponse({
    status: 403,
    description: 'jwt 토큰 인증 오류',
    schema: {
      example:{
        statusCode: 403,
        error : 'Forbidden',
        message: '잘못된 초대 링크입니다./초대 링크가 만료되었거나 유효하지 않습니다.'
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
  async createPaticipant(@Req() req, @Param('party_id') party_id:string, @Body() createParticipantDto:createParticipantDto){
    const uid = req.user.uid;
    
    await this.participantService.createParticipant(party_id, createParticipantDto, uid); // 모임 생성자 파티 참가자 테이블에 추가

  }

  @Get(':party_id/waiting')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getParticipantcount(@Param('party_id') party_id:string){
    return this.partyService.getPgetParticipantcount(party_id);
  }
}
