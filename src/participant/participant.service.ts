import { Injectable } from '@nestjs/common';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { customAlphabet } from 'nanoid';

@Injectable()
export class ParticipantService {
  constructor(private prisma: PrismaService) {}
  private nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

  createParticipant(party_id: string) {
    const code = this.nanoid();

    return this.prisma.participant.create({
      data:{
        party_id: party_id,  
        code: code,
      },
    });
  }

  findAll() {
    return `This action returns all participant`;
  }

  findOne(id: number) {
    return `This action returns a #${id} participant`;
  }

  update(id: number, updateParticipantDto: UpdateParticipantDto) {
    return `This action updates a #${id} participant`;
  }

  remove(id: number) {
    return `This action removes a #${id} participant`;
  }
}
