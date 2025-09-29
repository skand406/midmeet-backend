import { Injectable } from '@nestjs/common';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { PrismaService } from '../prisma/prisma.service';



@Injectable()
export class PartyService {
  constructor(private prisma: PrismaService){}

  createParty(createPartyDto: CreatePartyDto) {
    return this.prisma.party.create({
      data:{
        party_state: true,
        date_time: new Date(createPartyDto.date_time),
        party_name: createPartyDto.party_name,
      },
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
