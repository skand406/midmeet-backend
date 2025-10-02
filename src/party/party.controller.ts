import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, UseGuards, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { PartyService } from './services/party.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { ParticipantService } from 'src/party/services/participant.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';
import { CreateCourseArrayDto } from './dto/create-course.dto';
import { CourseService } from './services/course.service';

@Controller('party')
export class PartyController {
  constructor(
    private partyService: PartyService,
    private participantService: ParticipantService,
    private userService: UserService,
    private courseService: CourseService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @ApiBearerAuth()
  @ApiBody({ 
    type: CreatePartyDto,
    description: "모임 생서에 필요한 정보"
  })
  async createParty(@Req() req, @Body() createPartyDto: CreatePartyDto) {
    const uid = req.user.uid; // JWT에서 유저 추출
    const user = await this.userService.findById(uid);
    if(!user){
      throw new ForbiddenException('유효하지 않은 사용자입니다.');
    }
    if(!user.isVerified){
      throw new ForbiddenException('이메일 인증 후 사용이 가능합니다.');
    }

    const party = await this.partyService.createParty(createPartyDto);
    await this.participantService.createParticipant(party.party_id, 'LEADER', uid); // 모임 생성자 파티 참가자 테이블에 추가

    return {
      "message": "모임이 생성되었습니다.",
      "party_id": party.party_id
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
    examples: {
      example1: {
        summary: '코스 추가 예시',  
        value: {
          courses: [
            { course_no: 1, tag: "#카페,#디저트,#조용한" },
            { course_no: 2, tag: "#맛집,#분위기,#조용한" }
          ]
        }
      },
    },
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

  findAll() {
    return this.partyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePartyDto: UpdatePartyDto) {
    return this.partyService.update(+id, updatePartyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partyService.remove(+id);
  }
}
