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
import { get, STATUS_CODES } from 'http';
import { createParticipantDto } from './dto/create-participant.dto';
import { JwtService } from '@nestjs/jwt';
import { error } from 'console';
import { UpdateParticipantDto } from './dto/update-participant.dto';

@ApiTags('party')
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
  @ApiOperation({
    summary: '모임 초대 링크',
    description: '모임 초대 인증용 jwt 토큰 및 인증 기간을 반환'
  })
  @ApiBearerAuth()
  @ApiParam({
    name:'party_id',
    required:true,
    description:'모임 id'
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expires_in: '7일',
      },
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
  generateInviteToken(@Param('party_id') party_id: string) {
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
  @HttpCode(HttpStatus.OK)
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
    await this.participantService.createLeaderParticipant(party.party_id,uid);

    return {
      "message": "모임이 생성되었습니다.",
      "party_id": party.party_id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch(':party_id')
  @ApiOperation({summary:'모임 내용 수정'})
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
  @ApiOperation({summary:'코스 생성'})
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
  @ApiOperation({summary:'모임 삭제'})
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
  @ApiOperation({summary:'참여자 등록'})
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
    status: 200,
    description: '참여자 등록 성공',
    schema: {
      example: {
        message: '참여자가 성공적으로 등록되었습니다.',
        participant: {
          participant_id: 'p123abc',
          user_uid: 'u456xyz',
          role: 'MEMBER',
          transport_mode: 'PUBLIC',
        },
      },
    },
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
    
    await this.participantService.createMemberParticipant(party_id, createParticipantDto, uid); // 모임 생성자 파티 참가자 테이블에 추가

  }

  @Get(':party_id/waiting')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({summary:'모임별 등록된 참여자 수 '})
  @ApiResponse({
    status:200,
    description:'전체 모임원 및 등록된 모임원 현황을 알려줌',
    schema:{
      example: {
        whole_count: 5,
        current_participant_count : 3
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
  async getParticipantcount(@Param('party_id') party_id:string){
    return this.partyService.getPgetParticipantcount(party_id);
  }


  @Get(':party_id/verify-invite')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard) 
  @ApiOperation({summary:'초대 토큰 검증'})
  @ApiBearerAuth()
  @ApiQuery({
    name: 'token',
    required: true,
    description: '초대 링크 토큰 (쿼리 파라미터로 전달)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiResponse({
    status:200,
    description:'인증되면 모임의 이름을 반환',
    schema: {
      example: {
        party_name: '주말 회식 모임',
      },
    }
  })
  @ApiResponse({
    status:403,
    description: '초대 토큰 인증 실패',
    schema:{
      example:{
        statusCode: 403,
        error:'Forbidden',
        message:'잘못된 초대 링크 입니다.'
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
  async verifyInvite(@Param('party_id') party_id:string , @Query('token') token:string){
    return this.participantService.verifyInviteToken(token,party_id);
  }

  @Patch(':party_id/participant')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard) 
  @ApiOperation({summary:'참여자 정보 수정'})
  @ApiBearerAuth()
  @ApiBody({
    type: UpdateParticipantDto,
    description:'참여자 정보 수정'
  })
  @ApiResponse({
    status:200,
    description: '참여자 정보 수정 성공',
    schema: {
      example: {
        "participant_id": "cmgkb3nrn0002vpv4c7a5923c",
        "party_id": "cmgkb3nql0000vpv4f4pngjfj",
        "user_uid": "cmgi2iz0t0000vpl4ar8agr47",
        "transport_mode": "PUBLIC",
        "role": "LEADER",
        "code": "EYVRZL",
        "start_lat": "126.699903",
        "start_lng": "37.426111",
        "start_address": "인천광역시 연수구 선학로 100"
      },
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
  })  async updateParticipant(@Req() req,@Param('party_id') party_id:string, @Body() UpdateParticipantDto:UpdateParticipantDto){
    const uid = req.user.uid;
    return this.participantService.updateParticipant(uid,party_id,UpdateParticipantDto);

  }
}
