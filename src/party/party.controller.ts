
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Query,
  HttpException,
} from '@nestjs/common';
import { PartyService } from './services/party/party.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { ParticipantService } from './services/participant/participant.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';
import { get, STATUS_CODES } from 'http';
import { createParticipantDto } from './dto/create-participant.dto';
import { JwtService } from '@nestjs/jwt';
import { error } from 'console';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { PARAMTYPES_METADATA } from '@nestjs/common/constants';
import { CourseService } from './services/course/course.service';
import { CreateCourseArrayDto } from './dto/create-course.dto';
import { UpdateCourseArrayDto, UpdateCourseDto } from './dto/update-course.dto';
import { OtpService } from './services/otp/otp.service';
import { KakaoService } from './services/kakao/kakao.service';
import { MailService } from 'src/auth/mail.service';
import { MidPartyDto } from './dto/mid-data.dto';
import { map } from 'rxjs';
import { plainToClass } from 'class-transformer';
import { start } from 'repl';
import { GuestService } from './services/guest.service';
import { GuestDto } from './dto/guest.dto';
import { ResultService } from './services/result/result.service';
import { CommonService } from './services/common/common.service';

@ApiTags('party')
@Controller('party')
export class PartyController {
  constructor(
    private partyService: PartyService,
    private participantService: ParticipantService,
    private userService: UserService,
    private courseService: CourseService,
    private jwtService: JwtService,
    private otpService: OtpService,
    private kakaoService: KakaoService,
    private mailService: MailService,
    private guestService: GuestService,
    private resultService: ResultService,
    private commonService :CommonService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get(':party_id/invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '모임 초대 링크',
    description: '모임 초대 인증용 jwt 토큰 및 인증 기간을 반환',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'party_id',
    required: true,
    description: '모임 id',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expires_in: '7일',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '서버 내부 오류 (DB 문제 등)',
    schema: {
      example: {
        statusCode: 500,
        error: 'Internal Server Error',
      },
    },
  })
  generateInviteToken(@Param('party_id') party_id: string) {
    const payload = {
      party_id,
      //exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7일 유효
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '7d', // '7d' = 7일, v9에서 안전
    });

    return {
      token: token,
      expires_in: '7일',
    };
  }

  @ApiOperation({
    summary: '모임 생성',
    description:
      'JWT 인증된 사용자가 새로운 모임을 생성합니다. 이메일 인증 완료된 사용자만 가능.',
  })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post()
  @ApiBearerAuth()
  @ApiBody({
    type: CreatePartyDto,
    description: '모임 생서에 필요한 정보',
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
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자 정보 없음',
    schema: {
      example: {
        statusCode: 404,
        message: '유효하지 않은 사용자입니다.',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'JWT 토큰 오류',
    schema: {
      example: {
        statusCode: 401,
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '서버 내부 오류 (DB 문제 등)',
    schema: {
      example: {
        statusCode: 500,
        error: 'Internal Server Error',
      },
    },
  })
  async createParty(@Req() req, @Body() createPartyDto: CreatePartyDto) {
    const uid = req.user.uid; // JWT에서 유저 추출
    const user = await this.userService.findById(uid);
    if (!user) {
      throw new NotFoundException('유효하지 않은 사용자입니다.');
    }
    if (!user.isVerified) {
      throw new ForbiddenException('이메일 인증 후 사용이 가능합니다.');
    }

    const party = await this.partyService.createParty(createPartyDto);
    await this.participantService.createLeaderParticipant(party.party_id, uid);
    return {
      message: '모임이 생성되었습니다.',
      party_id: party.party_id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch(':party_id')
  @ApiOperation({ summary: '모임 내용 수정' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'party_id',
    required: true,
    description: '모임 ID',
  })
  @ApiBody({
    type: UpdatePartyDto,
    description: '모임 설정 변경에 필요한 정보',
  })
  @ApiResponse({
    status: 200,
    description: '업데이트 된 코스의 내용을 반환',
    schema: {
      example: {
        course_id: 'cmgk7skfi0003p5nk51pjk991',
        party_id: 'cmgk7skam0000p5nkt2iqkr8b',
        place_name: '신부산갈매기',
        place_address: '인천 연수구 학나래로6번길 35 1층 신부산갈매기',
        course_no: 1,
        tag: '일식, 카페',
        course_view: true,
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
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자 정보 없음',
    schema: {
      example: {
        statusCode: 404,
        message: '유효하지 않은 사용자입니다.',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'JWT 토큰 오류',
    schema: {
      example: {
        statusCode: 401,
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '서버 내부 오류 (DB 문제 등)',
    schema: {
      example: {
        statusCode: 500,
        error: 'Internal Server Error',
      },
    },
  })
  async updateParty(
    @Req() req,
    @Body() updatePartyDto: UpdatePartyDto,
    @Param('party_id') party_id: string,
  ) {
    const uid = req.user.uid; // JWT에서 유저 추출
    const user = await this.userService.findById(uid);
    if (!user) {
      throw new NotFoundException('유효하지 않은 사용자입니다.');
    }
    if (!user.isVerified) {
      throw new ForbiddenException('이메일 인증 후 사용이 가능합니다.');
    }
    return await this.partyService.updatePartyType(updatePartyDto, party_id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post(':party_id/course')
  @ApiOperation({ summary: '코스 생성' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'party_id',
    required: true,
    description: '모임 ID',
  })
  @ApiBody({
    type: CreateCourseArrayDto,
    description: '모임에 추가할 코스 정보(순서 및 검색 태그)',
  })
  @ApiResponse({
    status: 200,
    description: '',
    schema: {
      example: [
        {
          course_id: 'cmgk7skfi0003p5nk51pjk991',
          party_id: 'cmgk7skam0000p5nkt2iqkr8b',
          place_name: null,
          place_address: null,
          course_no: 1,
          tag: '일식, 카페',
          course_view: true,
        },
        {
          course_id: 'cmgk7skfi0004p5nkizu99hmq',
          party_id: 'cmgk7skam0000p5nkt2iqkr8b',
          place_name: null,
          place_address: null,
          course_no: 2,
          tag: '한식, 분식, 디저트',
          course_view: true,
        },
      ],
    },
  })
  @ApiResponse({
    status: 406,
    description: '이메일 인증이 완료되지 않음',
    schema: {
      example: {
        statusCode: 406,
        message: '이메일 인증 후 사용이 가능합니다.',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자 정보 없음',
    schema: {
      example: {
        statusCode: 404,
        message: '유효하지 않은 사용자입니다.',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'JWT 토큰 오류',
    schema: {
      example: {
        statusCode: 401,
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '서버 내부 오류 (DB 문제 등)',
    schema: {
      example: {
        statusCode: 500,
        error: 'Internal Server Error',
      },
    },
  })
  @ApiResponse({
    status: 405,
    description: '파티가 존재하지 않는 경우',
    schema: {
      example: {
        statusCode: 405,
        message: '존재하지 않는 모임입니다.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: '코드 번호가 겹칠 경우',
    schema: {
      example: {
        statusCode: 409,
        message: '해당 모임에서 이미 존재하는 course_no 입니다.',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '권한이 없는 사용자',
    schema: {
      example: {
        statusCode: 403,
        message: '권한이 없는 사용자입니다.',
        error: 'forbidden',
      },
    },
  })
  @ApiResponse({
    status: 407,
    description: '파티에 참여하지 않은 사용자',
    schema: {
      example: {
        statusCode: 407,
        message: '참여자 정보를 찾을 수 없습니다.',
      },
    },
  })
  async createCourse(
    @Req() req,
    @Body() createCourseArrayDto: CreateCourseArrayDto,
    @Param('party_id') party_id: string,
  ) {
    const uid = req.user.uid; // JWT에서 유저 추출
    const user = await this.userService.findById(uid);
    const participant = await this.participantService.findOne(uid, party_id);

    if (!user) {
      throw new NotFoundException('유효하지 않은 사용자입니다.');
    }
    if (!user.isVerified) {
      throw new HttpException('이메일 인증 후 사용이 가능합니다.', 406);
    }
    if (!participant) {
      throw new HttpException('참여자 정보를 찾을 수 없습니다.', 407);
    }
    if (participant.role !== 'LEADER') {
      throw new ForbiddenException('권한이 없는 사용자입니다.');
    }
    return await this.courseService.createCourse(
      party_id,
      createCourseArrayDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':party_id/courseArray')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      '코스 수정 : 모임이 ai 타입일때 코스 장소를 배열 형태로 한번에 선택 후 저장',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'party_id',
    description: '모임 id',
  })
  @ApiBody({ type: UpdateCourseArrayDto })
  @ApiResponse({
    status: 200,
    description: '',
    schema: {
      example: [
        {
          course_id: 'cmgk7skfi0003p5nk51pjk991',
          party_id: 'cmgk7skam0000p5nkt2iqkr8b',
          place_name: null,
          place_address: null,
          course_no: 1,
          tag: '일식, 카페',
          course_view: true,
        },
        {
          course_id: 'cmgk7skfi0004p5nkizu99hmq',
          party_id: 'cmgk7skam0000p5nkt2iqkr8b',
          place_name: null,
          place_address: null,
          course_no: 2,
          tag: '한식, 분식, 디저트',
          course_view: true,
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'JWT 토큰 오류',
    schema: {
      example: {
        statusCode: 401,
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'participant의 role이 leader가 아님',
    schema: {
      example: {
        statusCode: 403,
        message: '권한이 없는 사용자입니다.',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'participant 테이블에서 리턴되는 값 없음.',
    schema: {
      example: {
        statusCode: 404,
        message: '참여자 정보를 찾을 수 없습니다..',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '서버 내부 오류 (DB 문제 등)',
    schema: {
      example: {
        statusCode: 500,
        error: 'Internal Server Error',
      },
    },
  })
  async updateCourseArray(
    @Req() req,
    @Body() updateCourseArrayDto: UpdateCourseArrayDto,
    @Param('party_id') party_id: string,
  ) {
    const uid = req.user.uid;

    const participant = await this.participantService.findOne(uid, party_id);
    if (!participant) {
      throw new NotFoundException('참여자 정보를 찾을 수 없습니다.');
    }
    if (participant.role !== 'LEADER') {
      throw new ForbiddenException('권한이 없는 사용자입니다.');
    }

    return await this.courseService.updateArrayCourse(
      party_id,
      updateCourseArrayDto,
    );
  }

  @Patch(':party_id/course/:course_id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '코스 수정: 모임이 사용자 지정 타입일 때 각 단일 코스를 수정',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'course_id',
    description: '코스 id',
  })
  @ApiParam({
    name: 'party_id',
    description: '파티 id',
  })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({
    status: 200,
    description: '',
    schema: {
      example: [
        {
          course_id: 'cmgk7skfi0003p5nk51pjk991',
          party_id: 'cmgk7skam0000p5nkt2iqkr8b',
          place_name: null,
          place_address: null,
          course_no: 1,
          tag: '일식, 카페',
          course_view: true,
        },
        {
          course_id: 'cmgk7skfi0004p5nkizu99hmq',
          party_id: 'cmgk7skam0000p5nkt2iqkr8b',
          place_name: null,
          place_address: null,
          course_no: 2,
          tag: '한식, 분식, 디저트',
          course_view: true,
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'JWT 토큰 오류',
    schema: {
      example: {
        statusCode: 401,
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'participant의 role이 leader가 아님',
    schema: {
      example: {
        statusCode: 403,
        message: '권한이 없는 사용자입니다.',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'participant 테이블에서 리턴되는 값 없음.',
    schema: {
      example: {
        statusCode: 404,
        message: '참여자 정보를 찾을 수 없습니다..',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '서버 내부 오류 (DB 문제 등)',
    schema: {
      example: {
        statusCode: 500,
        error: 'Internal Server Error',
      },
    },
  })
  async updateCourse(
    @Req() req,
    @Body() updateCourseDto: UpdateCourseDto,
    @Param('course_id') course_id: string,
    @Param('party_id') party_id: string,
  ) {
    const uid = req.user.uid;
    const participant = await this.participantService.findOne(uid, party_id);
    if (!participant) {
      throw new NotFoundException('참여자 정보를 찾을 수 없습니다.');
    }
    if (participant.role !== 'LEADER') {
      throw new ForbiddenException('권한이 없는 사용자입니다.');
    }
    return await this.courseService.updateCourse(
      party_id,
      course_id,
      updateCourseDto,
    );
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
  @ApiOperation({ summary: '모임 삭제' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'party_id',
    required: true,
    description: '모임 id',
  })
  @ApiResponse({
    status: 406,
    description: 'role이 member인 사용자 : 삭제 권한이 없는 유저',
    schema: {
      example: {
        statusCode: 406,
        message: '삭제 권한이 없는 유저입니다.',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '참여자 정보 없음',
    schema: {
      example: {
        statusCode: 404,
        message: '참여 정보를 찾을 수 없습니다.',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'JWT 토큰 오류',
    schema: {
      example: {
        statusCode: 401,
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '서버 내부 오류 (DB 문제 등)',
    schema: {
      example: {
        statusCode: 500,
        error: 'Internal Server Error',
      },
    },
  })
  remove(@Req() req, @Param('party_id') party_id: string) {
    const uid = req.user.uid;
    return this.partyService.remove(party_id, uid);
  }

  @Post(':party_id/participant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '참여자 등록' })
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'party_id',
    required: true,
    description: '모임 id',
  })
  @ApiBody({
    type: createParticipantDto,
    description: '모임에 참여하는 사람들 초대',
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
          start_address: '인천광역시 연수구 선학로 100',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'jwt 토큰 인증 오류',
    schema: {
      example: {
        statusCode: 403,
        error: 'Forbidden',
        message:
          '잘못된 초대 링크입니다./초대 링크가 만료되었거나 유효하지 않습니다.',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '서버 내부 오류 (DB 문제 등)',
    schema: {
      example: {
        statusCode: 500,
        error: 'Internal Server Error',
      },
    },
  })
  async createPaticipant(
    @Req() req,
    @Param('party_id') party_id: string,
    @Body() createParticipantDto: createParticipantDto,
  ) {
    const uid = req.user.uid;
    const user = await this.userService.findById(uid);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const participant = await this.participantService.createMemberParticipant(
      party_id,
      createParticipantDto,
      uid,
    );
    const party = await this.partyService.readParty(party_id);
    const count = (await this.participantService.findMany(party_id)).length;
    if (party?.participant_count === count){
      const participant = await this.participantService.findLeader(party_id);
      if (!participant?.user_uid) {
        // 리더가 없으면 스킵하거나 에러 처리
        return;
      }

      const leader = await this.userService.findById(participant.user_uid);
      if (!leader?.email) {
        // 이메일 없으면 스킵하거나 에러 처리
        return;
      }
      await this.mailService.sendMidPointMail(leader.email, party_id);
    }
    return participant; // 모임 생성자 파티 참가자 테이블에 추가
  }

  @Get(':party_id/waiting')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '모임별 등록된 참여자 수 ' })
  @ApiResponse({
    status: 200,
    description: '전체 모임원 및 등록된 모임원 현황을 알려줌',
    schema: {
      example: {
        whole_count: 5,
        current_participant_count: 3,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '서버 내부 오류 (DB 문제 등)',
    schema: {
      example: {
        statusCode: 500,
        error: 'Internal Server Error',
      },
    },
  })
  async getParticipantcount(@Param('party_id') party_id: string) {
    return this.partyService.readParticipantcount(party_id);
  }

  @Get(':party_id/verify-invite')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '초대 토큰 검증' })
  @ApiBearerAuth()
  @ApiQuery({
    name: 'token',
    required: true,
    description: '초대 링크 토큰 (쿼리 파라미터로 전달)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiResponse({
    status: 200,
    description: '인증되면 모임의 이름을 반환',
    schema: {
      example: {
        party_name: '주말 회식 모임',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '초대 토큰 인증 실패',
    schema: {
      example: {
        statusCode: 403,
        error: 'Forbidden',
        message: '잘못된 초대 링크 입니다.',
      },
    },
  })
  @ApiResponse({
    status: 406,
    description: '참여자 저장 완료된 유저가 다시 초대 링크 접근 방지',
    schema: {
      example: {
        statusCode: 406,
        message: '이미 참여한 모임입니다.',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '서버 내부 오류 (DB 문제 등)',
    schema: {
      example: {
        statusCode: 500,
        error: 'Internal Server Error',
      },
    },
  })
  async verifyInvite(
    @Req() req,
    @Param('party_id') party_id: string,
    @Query('token') token: string,
  ) {
    const uid = req.user.uid;
    const participant = await this.participantService.findOne(uid,party_id);
    if(participant?.start_address){
      throw new HttpException('이미 참여한 모임입니다.', 406);
    }
    return this.participantService.verifyInviteToken(token, party_id);
  }

  
  @Get(':party_id/result')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findResultPage(@Req() req, @Param('party_id') party_id: string) {
    const uid = req.user.uid;
    return await this.resultService.getResult(party_id,uid);
  }


  @Get(':party_id/mid')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findMidPage(@Req() req, @Param('party_id') party_id: string) {
    const uid = req.user.uid;
    const party = await this.partyService.readParty(party_id);
    const course_list = await this.courseService.readCourseList(party_id);
    if (!party || !course_list) throw new NotFoundException('모임이 없습니다.');

    const toNum = (v: any) => Number(v ?? 0);

    let midpoint = {
      name: party.mid_place ?? '',
      lat: toNum(party.mid_lat),
      lng: toNum(party.mid_lng),
    };

    if (!party.mid_place) {
      const participants = await this.participantService.findMany(party_id);
      midpoint = await this.otpService.getCrossMid(party,participants);
      await this.partyService.updatePartyType({
        mid_place: midpoint.name ?? undefined,
        mid_lat: toNum(midpoint.lat),
        mid_lng: toNum(midpoint.lng),
      }, party_id);
    }
        
    let data: any = {};
    let arr: any;

    /* ---------------------------------------------------
        AI_COURSE
    --------------------------------------------------- */
    if (party.party_type === 'AI_COURSE') {
      arr = await this.kakaoService.findAICoursePlaces(
        course_list,
        midpoint.lat,
        midpoint.lng,
      );

      const convertName = [
        '거리우선 추천코스',
        '인기우선 추천코스',
        'AI추천 코스',
      ];

      // 각 추천 유형을 course 단위로 묶기
      const listPromises = [
        // 첫 번째 코스 (distance)
        (async () => {
            // places 내부의 모든 비동기 작업을 Promise.all로 묶어서 처리
            const resolvedPlaces = await Promise.all(
                arr.distance.map(async (l) => ({
                    placeId: l.course_id,
                    placeName: l.place.place_name,
                    placeAddr: l.place.address_name,
                    placeUrl: l.place.place_url,
                    lat: Number(l.place.y),
                    lng: Number(l.place.x),
                    // this.getPlaceImageUrl 호출
                    imageUrl: await this.commonService.getPlaceImageUrl(l.place.place_url),
                })),
            );

            return {
                courseId: Math.floor(100000 + Math.random() * 900000).toString(),
                courseNo: 1,
                courseName: convertName[0],
                places: resolvedPlaces, // 실제 데이터 배열 할당
            };
        })(), // 즉시 실행하여 Promise를 listPromises 배열에 추가

        // 두 번째 코스 (accuracy)
        (async () => {
            const resolvedPlaces = await Promise.all(
                arr.accuracy.map(async (l) => ({
                    placeId: l.course_id,
                    placeName: l.place.place_name,
                    placeAddr: l.place.address_name,
                    placeUrl: l.place.place_url,
                    lat: Number(l.place.y),
                    lng: Number(l.place.x),
                    imageUrl: await this.commonService.getPlaceImageUrl(l.place.place_url),
                })),
            );

            return {
                courseId: Math.floor(100000 + Math.random() * 900000).toString(),
                courseNo: 2,
                courseName: convertName[1],
                places: resolvedPlaces,
            };
        })(),

        // 세 번째 코스 (diversity)
        (async () => {
            const resolvedPlaces = await Promise.all(
                arr.diversity.map(async (l) => ({
                    placeId: l.course_id,
                    placeName: l.place.place_name,
                    placeAddr: l.place.address_name,
                    placeUrl: l.place.place_url,
                    lat: Number(l.place.y),
                    lng: Number(l.place.x),
                    imageUrl: await this.commonService.getPlaceImageUrl(l.place.place_url),
                })),
            );

            return {
                courseId: Math.floor(100000 + Math.random() * 900000).toString(),
                courseNo: 3,
                courseName: convertName[2],
                places: resolvedPlaces,
            };
        })(),
      ];

      // listPromises 배열에 있는 3개의 큰 비동기 작업이 모두 완료될 때까지 기다림
      const list = await Promise.all(listPromises);

      // 최종 반환 데이터
      data = {
        party: {
          partyName: party.party_name,
          partyDate: party.date_time,
          midPoint: midpoint.name,
          midPointLat: midpoint.lat,
          midPointLng: midpoint.lng,
          partyType: party.party_type,
          courses: course_list.map((c) => ({
            courseNo: c.course_no,
            courseId: c.course_id,
            places: {
              placeId: '',
              placeName: c.place_name ?? '',
              placeAddr: c.place_address ?? '',
              lat: c.place_lat ?? 0,
              lng: c.place_lng ?? 0,
              placeUrl: c.place_url ?? '',
              imageUrl: '',
            },
          })),
        },
        list,  // ⬅ 배열 형태로 반환됨
      };

      return data;
    }

    /* ---------------------------------------------------
        CUSTOM_COURSE
    --------------------------------------------------- */
    arr = await this.kakaoService.findCustomCoursePlaces(
      party_id,
      course_list[0].course_id,
      midpoint.lat,
      midpoint.lng,
    );

    data = {
      party: {
        partyName: party.party_name,
        partyDate: party.date_time,
        midPoint: midpoint.name,
        midPointLat: midpoint.lat,
        midPointLng: midpoint.lng,
        partyType: party.party_type,
        courses: course_list.map((c) => ({
          courseNo: c.course_no,
          courseId: c.course_id,
          places: {
            placeId: '',
            placeName: c.place_name ?? '',
            placeAddr: c.place_address ?? '',
            lat: c.place_lat ?? 0,
            lng: c.place_lng ?? 0,
          },
        })),
      },
      list: await Promise.all(arr.map(async (l) => ({
        placeId: l.id,
        placeName: l.place_name,
        placeAddr: l.address_name,
        placeUrl: l.place_url,
        imageUrl: await this.commonService.getPlaceImageUrl(l.place_url),
        lat: l.y,
        lng: l.x,
      })))
    };

    return data;
  }

  //모임에 선정가능한 장소 리스트를 불러오는 기능
  @Get('course_list/:party_id/:course_id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiParam({
    name:'party_id',
    required:true,
    description:'파티id',
  })
  @ApiParam({
    name:'course_id',
    required:true,
    description:'코스id',
  })
  @ApiQuery({
    name:'lat',
    required:false,
    description:'위도(선택)'
  })
  @ApiQuery({
    name:'lng',
    required:false,
    description:'경도(선택)'
  }) 
  async getCourseList(
    @Param('party_id') party_id: string,
    @Param('course_id') course_id: string,
    @Query('lat') lat: number,
    @Query('lng') lng: number,
  ) {
    const party = await this.partyService.readParty(party_id);
    const list = await this.kakaoService.findCustomCoursePlaces(
      party_id,
      course_id,
      lat,
      lng,
    );
    return {
      list: await Promise.all(list.map(async (l) => ({
        placeId: l.id,
        placeName: l.place_name,
        placeAddr: l.address_name,
        lat: l.y,
        lng: l.x,
        placeUrl: l.place_url,
        imageUrl: await this.commonService.getPlaceImageUrl(l.place_url),
      }))),
    };
  }


  @Get(':party_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '모임 정보 조회' })
  @ApiResponse({
    status: 200, 
    description: '모임 정보 조회 성공',
    schema: {
      example: { 
        party_id: 'cmgtao6uo0004vp3kd1s7b3x7',
        party_name: '주말 회식 모임',
        party_type: 'AI_COURSE',  
        date_time: '2024-08-15T18:30:00.000Z',
        participant_count: 5,
        mid_place: '중앙공원',
        mid_lat: 37.123456,
        mid_lng: 127.123456
      },  
    },
  })
  @ApiResponse({    
    status: 500,  
    description: '서버 내부 오류 (DB 문제 등)',    
    schema: {      
      example: {        
        statusCode: 500,        
        error: 'Internal Server Error',      
      },    
    },  
  })  
  async getPartyInfo(@Param('party_id') party_id: string) {    
    return await this.partyService.readParty(party_id); 
  }

  @Get(':party_id/course')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '코스 리스트 불러오기'
  })
  @ApiResponse({
    status:200,
    description:'코스 리스트',
    schema:{
      type:'array',
      items:{
        type: 'object',
        example:{
          courseNo: 1,
          courseId: 901,
          places: {
            placeId: 901,
            placeName: '추천 맛집 A',
            placeAddr: '강남구 역삼동 123-45',
            lat: 37.4981,
            lng: 127.0285,
          },
        }
      }
    },
  })
  async getCourseListInfo(@Param('party_id') party_id:string){

    const course_list = await this.courseService.readCourseList(party_id);
    return {
      courses: course_list.map( c => ({
        courseNo:c.course_no,
        courseId:c.course_id,
          places:{
            placeName:c.place_name,
            placeAddr:c.place_address,
            lat:c.place_lat,
            lng:c.place_lng
          }
        }
      ))}
    }

 // 게스트용
  @Post('/guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '게스트 모임 생성' })
  @ApiBody({ type: GuestDto, description: '게스트 모임 생성에 필요한 정보(토큰 필요없음)' })
  @ApiResponse({
    status: 200,
    description: '게스트 모임 생성 성공',
    schema: {
      example: {
      "statusCode": 200,
      "data": {
          "party": {
              "partyName": "정윤초현",
              "partyDate": "2025-11-27T17:30:00",
              "midPoint": "달월",
              "midPointLat": 37.37968,
              "midPointLng": 126.74518,
              "partyType": "AI_COURSE",
              "courses": [
                  {
                      "courseNo": 1,
                      "courseId": "1764057612380",
                      "places": {
                          "placeId": "",
                          "placeName": "",
                          "placeAddr": "",
                          "lat": 0,
                          "lng": 0
                      }
                  },
                  {
                      "courseNo": 2,
                      "courseId": "1764057645831",
                      "places": {
                          "placeId": "",
                          "placeName": "",
                          "placeAddr": "",
                          "lat": 0,
                          "lng": 0
                      }
                  }
              ]
          },
          "list": [
              {
                  "courseId": "241040",
                  "courseNo": 1,
                  "courseName": "거리우선 추천코스",
                  "places": [
                      {
                          "placeId": "1764057612380",
                          "placeName": "평이담백 뼈칼국수 신세계아울렛시흥프리미엄",
                          "placeAddr": "경기 시흥시 배곧동 36",
                          "lat": 37.3797942465734,
                          "lng": 126.73835989687
                      },
                      {
                          "placeId": "1764057645831",
                          "placeName": "소바공방 신세계아울렛시흥프리미엄",
                          "placeAddr": "경기 시흥시 배곧동 36",
                          "lat": 37.379701214667634,
                          "lng": 126.7382574734017
                      }
                  ]
              },
              {
                  "courseId": "597064",
                  "courseNo": 2,
                  "courseName": "인기우선 추천코스",
                  "places": [
                      {
                          "placeId": "1764057612380",
                          "placeName": "만석씨푸드 본점",
                          "placeAddr": "경기 시흥시 배곧동 18-7",
                          "lat": 37.3823736934317,
                          "lng": 126.735847666764
                      },
                      {
                          "placeId": "1764057645831",
                          "placeName": "히바린 신세계아울렛시흥프리미엄",
                          "placeAddr": "경기 시흥시 배곧동 36",
                          "lat": 37.37991044534868,
                          "lng": 126.73591276097015
                      }
                  ]
              },
              {
                  "courseId": "217073",
                  "courseNo": 3,
                  "courseName": "AI추천 코스",
                  "places": [
                      {
                          "placeId": "1764057612380",
                          "placeName": "정든한우 소머리국밥 배곧신도시점",
                          "placeAddr": "경기 시흥시 배곧동 18-4",
                          "lat": 37.382261905478764,
                          "lng": 126.73501476645305
                      },
                      {
                          "placeId": "1764057645831",
                          "placeName": "사보텐 신세계배곧점",
                          "placeAddr": "경기 시흥시 배곧동 36",
                          "lat": 37.37990079861863,
                          "lng": 126.73846453181277
                      }
                  ]
              }
          ]
        },
      },
    },
  })
  async guestParty(@Body() dto: GuestDto) {
    return await this.guestService.guestParty(dto);
  }

  @Post('/guest/result')
  @HttpCode(HttpStatus.OK)
  async guestResult(@Body() dto: GuestDto) {
    return await this.guestService.guestResult(dto);
  }
}
