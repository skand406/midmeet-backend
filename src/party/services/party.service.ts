import { Injectable } from '@nestjs/common';
import { CreatePartyDto } from '../dto/create-party.dto';
import { UpdatePartyDto } from '../dto/update-party.dto';
import { PrismaService } from '../../prisma/prisma.service';



@Injectable()
export class PartyService {
  [x: string]: any;
  constructor(private prisma: PrismaService){}

  //모임 생성
  createParty(createPartyDto: CreatePartyDto) {
    return this.prisma.party.create({
      data:{
        party_state: true,
        date_time: new Date(createPartyDto.date_time),
        party_name: createPartyDto.party_name,
      },
    });
  }

  //모임 설정 변경 - 파티 유형, 파티 상태, 모임 날짜와 시간, 파티 이름
  updatePartyType(updatePartyDto: UpdatePartyDto, party_id: string) {
    return this.prisma.party.update({
      where: { party_id: party_id },
      data: { ...updatePartyDto }, //dto로 받은 값들로 업데이트
    });
  }
  
  findAll() {
    return `This action returns all party`;
  }

  findOne(id: number) {
    return `This action returns a #${id} party`;
  }

  update(id: number, updatePartyDto: UpdatePartyDto) {
    return `This action updates a #${id} party`;
  }

  remove(id: number) {
    return `This action removes a #${id} party`;
  }
}
