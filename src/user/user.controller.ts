import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CheckIdDto } from './dto/check-id.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FindIdDto } from './dto/find-id.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Req } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswdDto } from './dto/change-passwd.dto';
import { ResetPasswdDto } from './dto/reset-passwd.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ID 중복 확인
  @HttpCode(HttpStatus.OK)
  @Get('check-id')
  //#region swagger
  @ApiOperation({
    summary: 'ID 중복 확인',
    description: '회원가입시 입력한 ID가 이미 존재하는지 확인',
    operationId: 'checkId',
  })
  @ApiQuery({
    name: 'id',
    type: 'string',
    description: '확인할 사용자 ID',
    example: 'test_id123',
  })
  @ApiResponse({
    status: 200,
    description: '사용 가능한 ID 여부 반환',
    schema: {
      example: { available: true },
    },
  })
  //#endregion
  async checkId(@Query() q: CheckIdDto) {
    return this.userService.isCheckIdAvailable(q.id);
  }

  // ID 찾기 (이메일로)
  @HttpCode(HttpStatus.OK)
  @Get('find-id')
  //#region swagger
  @ApiOperation({
    summary: 'ID 찾기',
    description: '가입된 이메일로 ID 조회',
    operationId: 'findId',
  })
  @ApiQuery({
    name: 'email',
    type: 'string',
    description: '알고 싶은 id의 사용자 이메일',
    example: 'test_id123@example.com',
  })
  @ApiResponse({
    status: 404,
    description: '사용자 정보 없음',
    schema: {
      example: {
        statusCode: 404,
        message: '해당 이메일로 가입된 사용자가 없습니다.',
        error: 'Not Found',
      },
    },
  })
  //#endregion
  async findId(@Query() q: FindIdDto) {
    return this.userService.findId(q.email);
  }

  // 사용자 정보 조회
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('user-info')
  //#region swagger
  @ApiBearerAuth()
  @ApiOperation({
    summary: '사용자 정보 조회',
    description: 'JWT로 로그인된 사용자 정보 반환',
    operationId: 'getUserInfo',
  })
  @ApiResponse({
    status: 404,
    description: '사용자 정보 없음',
    schema: {
      example: {
        statusCode: 404,
        message: '해당 사용자가 존재하지 않습니다.',
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
  //#endregion
  async getUserInfo(@Req() req) {
    const uid = req.user.uid; // JWT에서 추출된 값
    return this.userService.getUserInfo(uid);
  }

  // 사용자 정보 수정 (이메일 인증된 사용자만 가능)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('user-info')
  //#region swagger
  @ApiBearerAuth()
  @ApiOperation({
    summary: '사용자 정보 수정',
    description:
      '이메일 인증 완료 사용자만 수정 가능. 이메일 변경하면 이메일 인증 필수',
    operationId: 'updateUserInfo',
  })
  @ApiResponse({
    status: 408,
    description: '이메일 변경 후 이메일 인증을 안 받은 경우',
    schema: {
      example: {
        statusCode: 408,
        message: '이메일 인증이 필요합니다.',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자 정보 없음',
    schema: {
      example: {
        statusCode: 404,
        message: '해당 사용자가 존재하지 않습니다.',
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
    status: 403,
    description: '이메일 인증이 완료되지 않음',
    schema: {
      example: {
        statusCode: 403,
        message: '이메일 인증 후에만 정보 수정이 가능합니다.',
        error: 'Forbidden',
      },
    },
  })
  //#endregion
  async updateUserInfo(@Req() req, @Body() body: UpdateUserDto) {
    const uid = req.user.uid; // JWT에서 추출된 값
    const user = await this.userService.findById(uid);

    if (!user) {
      throw new NotFoundException('해당 사용자가 존재하지 않습니다.');
    }
    if (!user.isVerified) {
      throw new ForbiddenException(
        '이메일 인증 후에만 정보 수정이 가능합니다.',
      );
    }
    if (user.isVerified && user.email !== body.email) {
      throw new HttpException('이메일 인증이 필요합니다.', 408);
    }

    return this.userService.updateUser(uid, body);
  }

  // 이메일 변경 요청 (이메일 인증된 사용자만 가능)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('change-email')
  //#region swagger
  @ApiBearerAuth()
  @ApiOperation({
    summary: '이메일 변경 요청',
    description: '이메일 변경 인증 메일 발송 -> 이메일에서 인증 링크 클릭',
    operationId: 'requestEmailChange',
  })
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
  //#endregion
  async requestEmailChange(@Req() req, @Body('email') email: string) {
    const uid = req.user.uid;

    return this.userService.requestEmailChange(uid, email);
  }

  // 비밀번호 재설정 요청 (이메일 인증된 사용자만 가능)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  //#region swagger
  @ApiBody({
    type: ResetPasswdDto,
    description: '비밀번호 재설정을 위한 사용자 정보',
  })
  @ApiOperation({
    summary: '비밀번호 재설정 요청',
    description: '입력된 이메일로 재설정 메일 발송',
    operationId: 'resetPassword',
  })
  @ApiResponse({
    status: 404,
    description: '사용자 정보 없음',
    schema: {
      example: {
        statusCode: 404,
        message: '입력한 아이디와 이메일이 일치하는 사용자가 없습니다.',
        error: 'Not Found',
      },
    },
  })
  //#endregion
  async resetPassword(@Body() body: ResetPasswdDto) {
    return this.userService.requestPasswordChange(body);
  }

  // 비밀번호 변경 (현재 비밀번호 + 새 비밀번호) - 로그인된 사용자만 가능
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('change-password')
  //#region swagger
  @ApiBearerAuth()
  @ApiOperation({
    summary: '비밀번호 변경',
    description: '로그인된 상태에서 현재 비밀번호 검증 후 새 비밀번호로 변경',
    operationId: 'changePassword',
  })
  @ApiBody({
    type: ChangePasswdDto,
    description: '비밀번호 변경을 위한 현재 비밀번호 및 새 비밀번호',
  })
  @ApiResponse({
    status: 411,
    description: '현재 비밀번호와 새로운 비밀번호가 같은 경우',
    schema: {
      example: {
        statusCode: 411,
        message: '새 비밀번호는 현재 비밀번호와 다르게 설정해야 합니다',
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
    status: 412,
    description: '현재 비밀번호가 저장된 기존 비밀번호와 다른 경우',
    schema: {
      example: {
        statusCode: 412,
        message: '현재 비밀번호가 일치하지 않습니다.',
      },
    },
  })
  //#endregion
  async changePassword(@Req() req, @Body() body: ChangePasswdDto) {
    const uid = req.user.uid; // JWT에서 유저 UID 추출

    return this.userService.changePassword(
      uid,
      body.current_passwd,
      body.new_passwd,
    );
  }

  // 회원 탈퇴
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('delete-user')
  //#region swagger
  @ApiBearerAuth()
  @ApiOperation({
    summary: '회원 탈퇴',
    description: '해당 계정 및 관련 데이터 삭제',
    operationId: 'deleteAccount',
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
  //#endregion
  async deleteAccount(@Req() req) {
    const uid = req.user.uid; // JWT에서 유저 UID 추출

    return this.userService.deleteAccount(uid);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('visits')
  //#region swagger
  @ApiBearerAuth()
  @ApiOperation({
    summary: '방문 기록 조회',
    description: '로그인한 유저가 참여한 모임 및 모임에 포함된 코스 조회',
    operationId: 'getUserVisits',
  })
  @ApiResponse({
    status: 200,
    description: '성공',
    schema: {
      example: [
        {
          party_id: 'cmgtfzmtj0003vpowoef9o917',
          date_time: '2025-12-31T18:30:00.000Z',
          party_name: '테스트용 모임',
          party_type: 'AI_COURSE',
          party_state: true,
          participant_count: 5,
          courses: [
            {
              course_id: 'cmgtaojsk0007vp3k82lqsnkl',
              course_no: 1,
              place_name: '신부산갈매기',
              place_address: '인천 연수구 학나래로6번길 35 1층 신부산갈매기',
            },
            {
              course_id: 'cmgtaojsk0008vp3k11176ng8',
              course_no: 2,
              place_name: '송탄식당 인천선학점',
              place_address: '인천 연수구 학나래로118번길 45 1층',
            },
          ],
          participants: [
            {
              role: 'LEADER',
            },
          ],
        },
      ],
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
  //#endregion
  async getUserVisits(@Req() req) {
    const uid = req.user.uid;

    return this.userService.getUserVisits(uid);
  }
}
