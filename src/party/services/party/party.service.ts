import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePartyDto } from '../../dto/create-party.dto';
import { UpdatePartyDto } from '../../dto/update-party.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserService } from '../../../user/user.service';



@Injectable()
export class PartyService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService
  ){}

  //모임 생성
  async createParty(createPartyDto: CreatePartyDto) {
    return await this.prisma.party.create({
      data:{
        party_state: true,
        date_time: new Date(createPartyDto.date_time),
        party_name: createPartyDto.party_name,
        participant_count : createPartyDto.participant_count,
        party_type:createPartyDto.party_type
      },
    });
  }

  //모임 설정 변경 - 파티 유형, 파티 상태, 모임 날짜와 시간, 파티 이름
  async updatePartyType(updatePartyDto: UpdatePartyDto, party_id: string) {
    return await this.prisma.party.update({
      where: { party_id: party_id },
      data: { ...updatePartyDto }, //dto로 받은 값들로 업데이트
    });
  }

  async remove(party_id: string, uid: string) {
    const participant = await this.prisma.participant.findUnique({
      where: {
        party_id_user_uid:{
          user_uid:uid,
          party_id:party_id
        }
      }
    }); 
    const party = await this.prisma.party.findUnique({where: {party_id: party_id}});
    
    if (!participant) {
      throw new NotFoundException('참여 정보를 찾을 수 없습니다.');
    }
    if(participant.role !== 'LEADER'){
      throw new HttpException('삭제 권한이 없는 유저입니다.',406);
    }
    await this.prisma.$transaction(async (prisma) => {
      await prisma.course.deleteMany({where : {party_id}}); // 없어도 되지만 명시적으로 작성함
      await prisma.participant.deleteMany({where:{party_id}});
      await prisma.party.delete({where:{party_id}})
    })
   
    return this.userService.getUserVisits(uid);
  }

  async readParticipantcount(party_id:string){
    const party = await this.prisma.party.findUnique({where : {party_id}})
    const current_participant_count = await this.prisma.participant.count({where: {party_id}})

    if(!party){
      throw new NotFoundException('해당 모임을 찾을 수 없습니다.');
    }

    return { 
      whole_count: party.participant_count,
      current_participant_count: current_participant_count
    }
  }

  async readParty(party_id:string){
    return await this.prisma.party.findUnique({where : {party_id}})

  }
}
