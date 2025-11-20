import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, UseGuards, HttpCode, HttpStatus, NotFoundException, Query, HttpException } from '@nestjs/common';
import { PartyService } from './services/party.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { ParticipantService } from 'src/party/services/participant.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';
import { get, STATUS_CODES } from 'http';
import { createParticipantDto } from './dto/create-participant.dto';
import { JwtService } from '@nestjs/jwt';
import { error } from 'console';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { PARAMTYPES_METADATA } from '@nestjs/common/constants';
import { CourseService } from './services/course.service';
import { CreateCourseArrayDto } from './dto/create-course.dto';
import { UpdateCourseArrayDto, UpdateCourseDto } from './dto/update-course.dto';
import { OtpService } from './services/otp.service';
import { KakaoService } from './services/kakao.service';
import { MidPartyDto } from './dto/mid-data.dto';

@ApiTags('party')
@Controller('party')
export class PartyController {
  constructor(
    private partyService: PartyService,
    private participantService: ParticipantService,
    private userService: UserService,
    private courseService: CourseService,
    private jwtService: JwtService,
    private otpService:OtpService,
    private kakaoService:KakaoService
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
    status: 200,
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
    status:200,
    description:'업데이트 된 코스의 내용을 반환',
    schema:{
      example:{
        "course_id": "cmgk7skfi0003p5nk51pjk991",
        "party_id": "cmgk7skam0000p5nkt2iqkr8b",
        "place_name": '신부산갈매기',
        "place_address": '인천 연수구 학나래로6번길 35 1층 신부산갈매기',
        "course_no": 1,
        "tag": "일식, 카페",
        "course_view": true
      },
    }
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
    status:200,
    description:'',
    schema:{
      example: [
        {
          "course_id": "cmgk7skfi0003p5nk51pjk991",
          "party_id": "cmgk7skam0000p5nkt2iqkr8b",
          "place_name": null,
          "place_address": null,
          "course_no": 1,
          "tag": "일식, 카페",
          "course_view": true
        },
        {
          "course_id": "cmgk7skfi0004p5nkizu99hmq",
          "party_id": "cmgk7skam0000p5nkt2iqkr8b",
          "place_name": null,
          "place_address": null,
          "course_no": 2,
          "tag": "한식, 분식, 디저트",
          "course_view": true
        },
      ],
    }
  })
  @ApiResponse({ 
    status: 406, 
    description: '이메일 인증이 완료되지 않음', 
    schema: { 
      example: { 
        statusCode: 406, 
        message: '이메일 인증 후 사용이 가능합니다.', 
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
  @ApiResponse({ 
    status: 403, 
    description: '권한이 없는 사용자', 
    schema: { 
      example: { 
        statusCode: 403, 
        message: '권한이 없는 사용자입니다.', 
        error: 'forbidden' 
      } 
    }
  })
  @ApiResponse({ 
    status: 407, 
    description: '파티에 참여하지 않은 사용자', 
    schema: { 
      example: { 
        statusCode: 407, 
        message: '참여자 정보를 찾을 수 없습니다.', 
      } 
    }
  })
  async createCourse(@Req() req, @Body() createCourseArrayDto: CreateCourseArrayDto, @Param('party_id') party_id: string) {
    const uid = req.user.uid; // JWT에서 유저 추출
    const user = await this.userService.findById(uid);
    const participant = await this.participantService.findOne(uid,party_id);

    if(!user){
      throw new NotFoundException('유효하지 않은 사용자입니다.');
    }
    if(!user.isVerified){
      throw new HttpException('이메일 인증 후 사용이 가능합니다.',406);
    }
    if(!participant){
      throw new HttpException('참여자 정보를 찾을 수 없습니다.',407);
    }
    if(participant.role !== 'LEADER'){
      throw new ForbiddenException('권한이 없는 사용자입니다.');
    }
    return await this.courseService.createCourse(party_id, createCourseArrayDto);
  }
  
  @UseGuards(JwtAuthGuard)
  @Patch(':party_id/courseArray')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary:'코스 수정 : 모임이 ai 타입일때 코스 장소를 배열 형태로 한번에 선택 후 저장'})
  @ApiBearerAuth()
  @ApiParam({
    name:'party_id',
    description:'모임 id'
  })
  @ApiBody({type:UpdateCourseArrayDto })
  @ApiResponse({
    status:200,
    description:'',
    schema:{
      example: [
        {
          "course_id": "cmgk7skfi0003p5nk51pjk991",
          "party_id": "cmgk7skam0000p5nkt2iqkr8b",
          "place_name": null,
          "place_address": null,
          "course_no": 1,
          "tag": "일식, 카페",
          "course_view": true
        },
        {
          "course_id": "cmgk7skfi0004p5nkizu99hmq",
          "party_id": "cmgk7skam0000p5nkt2iqkr8b",
          "place_name": null,
          "place_address": null,
          "course_no": 2,
          "tag": "한식, 분식, 디저트",
          "course_view": true
        },
      ],
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
    status: 403, 
    description: 'participant의 role이 leader가 아님', 
    schema: { 
      example: { 
        statusCode: 403, 
        message: '권한이 없는 사용자입니다.', 
        error: 'Forbidden' 
      } 
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'participant 테이블에서 리턴되는 값 없음.', 
    schema: { 
      example: { 
        statusCode: 404, 
        message: '참여자 정보를 찾을 수 없습니다..', 
        error: 'Not Found' 
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
  async updateCourseArray(@Req() req, @Body() updateCourseArrayDto:UpdateCourseArrayDto,@Param('party_id') party_id:string){
    const uid = req.user.uid;

    const participant = await this.participantService.findOne(uid,party_id);
    if(!participant){
      throw new NotFoundException('참여자 정보를 찾을 수 없습니다.');
    }
    if(participant.role !== 'LEADER'){
      throw new ForbiddenException('권한이 없는 사용자입니다.');
    }

    return await this.courseService.updateArrayCourse(party_id,updateCourseArrayDto);
  }

  @Patch(':party_id/course/:course_id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({summary:'코스 수정: 모임이 사용자 지정 타입일 때 각 단일 코스를 수정'})
  @ApiBearerAuth()
  @ApiParam({
    name:'course_id',
    description:'코스 id',
  })
  @ApiParam({
    name:'party_id',
    description:'파티 id'
  })
  @ApiBody({type:UpdateCourseDto})
  @ApiResponse({
    status:200,
    description:'',
    schema:{
      example: [
        {
          "course_id": "cmgk7skfi0003p5nk51pjk991",
          "party_id": "cmgk7skam0000p5nkt2iqkr8b",
          "place_name": null,
          "place_address": null,
          "course_no": 1,
          "tag": "일식, 카페",
          "course_view": true
        },
        {
          "course_id": "cmgk7skfi0004p5nkizu99hmq",
          "party_id": "cmgk7skam0000p5nkt2iqkr8b",
          "place_name": null,
          "place_address": null,
          "course_no": 2,
          "tag": "한식, 분식, 디저트",
          "course_view": true
        },
      ],
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
    status: 403, 
    description: 'participant의 role이 leader가 아님', 
    schema: { 
      example: { 
        statusCode: 403, 
        message: '권한이 없는 사용자입니다.', 
        error: 'Forbidden' 
      } 
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'participant 테이블에서 리턴되는 값 없음.', 
    schema: { 
      example: { 
        statusCode: 404, 
        message: '참여자 정보를 찾을 수 없습니다..', 
        error: 'Not Found' 
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
  async updateCourse(@Req() req, @Body() updateCourseDto:UpdateCourseDto, @Param('course_id') course_id: string,@Param('party_id') party_id:string){
    const uid = req.user.uid;
    const participant = await this.participantService.findOne(uid,party_id);
    if(!participant){
      throw new NotFoundException('참여자 정보를 찾을 수 없습니다.');
    }
    if(participant.role !== 'LEADER'){
      throw new ForbiddenException('권한이 없는 사용자입니다.');
    }
    return await this.courseService.updateCourse(party_id, course_id,updateCourseDto);
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
        participant: {
          participant_id: 'p123abc',
          user_uid: 'u456xyz',
          role: 'MEMBER',
          transport_mode: 'PUBLIC',
          code: '0ZIWT4',
          start_lat: 126.699903,
          start_lng: 37.426111,
          start_address: '인천광역시 연수구 선학로 100'
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
    
    return await this.participantService.createMemberParticipant(party_id, createParticipantDto, uid); // 모임 생성자 파티 참가자 테이블에 추가

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
    return this.partyService.readParticipantcount(party_id);
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

  // @Patch(':party_id/participant')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard) 
  // @ApiOperation({summary:'참여자 정보 수정'})
  // @ApiBearerAuth()
  // @ApiBody({
  //   type: UpdateParticipantDto,
  //   description:'참여자 정보 수정'
  // })
  // @ApiResponse({
  //   status:200,
  //   description: '참여자 정보 수정 성공',
  //   schema: {
  //     example: {
  //       "participant_id": "cmgkb3nrn0002vpv4c7a5923c",
  //       "party_id": "cmgkb3nql0000vpv4f4pngjfj",
  //       "user_uid": "cmgi2iz0t0000vpl4ar8agr47",
  //       "transport_mode": "PUBLIC",
  //       "role": "LEADER",
  //       "code": "EYVRZL",
  //       "start_lat": "126.699903",
  //       "start_lng": "37.426111",
  //       "start_address": "인천광역시 연수구 선학로 100"
  //     },
  //   }
  // })
  // @ApiResponse({ 
  //   status: 500, 
  //   description: '서버 내부 오류 (DB 문제 등)', 
  //   schema: { 
  //     example: { 
  //       statusCode: 500, 
  //       error: 'Internal Server Error' 
  //     } 
  //   }
  // })  async updateParticipant(@Req() req,@Param('party_id') party_id:string, @Body() UpdateParticipantDto:UpdateParticipantDto){
  //   const uid = req.user.uid;
  //   return this.participantService.updateParticipant(uid,party_id,UpdateParticipantDto);

  // }

  @Get(':party_id/result')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard) 
  @ApiBearerAuth()
  async findResultPage(@Req() req,@Param('party_id') party_id:string ){
    const uid = req.user.uid;
    const party = await this.partyService.readParty(party_id);
    const course_list = await this.courseService.readCourseList(party_id);
    const participant = await this.participantService.findOne(uid,party_id);
    //길찾기 

    const from = `${participant?.start_lat},${participant?.start_lng}`;
    const to = `${course_list[0]?.place_lat},${course_list[0]?.place_lng}`
    const date_time=`${party?.date_time}`;
    const mode = participant?.transport_mode || 'PUBLIC';
    const route = await this.otpService.getRoute(from,to,mode,date_time);
    return {party,course_list,route};
  }

  @Get(':party_id/mid')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard) 
  @ApiBearerAuth()
  async findMidPage(@Req() req,@Param('party_id') party_id:string ){
    const uid = req.user.uid;
    const party = await this.partyService.readParty(party_id);
    const course_list = await this.courseService.readCourseList(party_id);
    if(!party||!course_list) throw new NotFoundException('모임이 없습니다.');
    //길찾기 

    const midpoint = await this.otpService.getCrossMid(party_id);
    let list: any;

    if(party?.party_type==='AI_COURSE')  list = await this.kakaoService.findAICoursePlaces(party_id);
    else list = await this.kakaoService.findCustomCoursePlaces(party_id,course_list[0].course_id,midpoint.lat,midpoint.lng);
    
    return {
      party:{
        partyName: party.party_name,
        partyDate: party.date_time,
        midPoint: midpoint.name,
        midPointLat: midpoint.lat,
        midPointLng: midpoint.lng,
        courses: course_list.map((c, idx) => ({
        courseNo: c.course_no,
        courseId: c.course_id,
        places: {
          placeId: list[idx]?.id,
          placeName: list[idx]?.place_name,
          placeAddr: list[idx]?.address,
          lat: Number(list[idx].y),
          lng: Number(list[idx].x),
        }
      }))}
    }
  }

  @Get('course_list/:party_id/:course_id')
  async getCourseList(@Param('party_id') party_id:string,@Param('course_id') course_id:string, @Query('lat') lat: number,@Query('lng') lng: number,){
    const party = await this.partyService.readParty(party_id);

    return await this.kakaoService.findCustomCoursePlaces(party_id,course_id,lat,lng);
  }

  // @Get('test')
  // async test(){
  //   //return await this.kakaoService.findAICoursePlaces('cmgtao6uo0004vp3kd1s7b3x7');

  //   return await this.kakaoService.findCustomCoursePlaces('cmgtao6uo0004vp3kd1s7b3x7',course_id,lat,lng);
  // }
}
