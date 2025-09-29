import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, UseGuards, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { PartyService } from './party.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { ParticipantService } from 'src/participant/participant.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Req } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';

@Controller('party')
export class PartyController {
  constructor(
    private partyService: PartyService,
    private participantService: ParticipantService,
    private userService: UserService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT 토큰',
    required: true,
  })
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
    for (let i=0; i<createPartyDto.participant_count; i++){
      await this.participantService.createParticipant(party.party_id);
    }
    return {
      "message": "모임이 생성되었습니다.",
      "party_id": party.party_id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('type')
  @ApiHeader({
    name: 'Authorization',
    description: 'JWT 토큰',
    required: true,
  })  
  @ApiBody({
    type: UpdatePartyDto,
    description: "모임에서 중간지점을 검색하는 유형",
  })
  async updateParty(@Req() req, @Body() updatePartyDto: UpdatePartyDto){
    const uid = req.user.uid; // JWT에서 유저 추출
    const user = await this.userService.findById(uid);
    if(!user){
      throw new NotFoundException('유효하지 않은 사용자입니다.');
    }
    if(!user.isVerified){
      throw new ForbiddenException('이메일 인증 후 사용이 가능합니다.');
    }
    return await this.partyService.updatePartyType(updatePartyDto);
    
  }

  @Get()
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
