import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { customAlphabet } from 'nanoid';
import { RoleType } from '@prisma/client';
import { createParticipantDto } from '../dto/create-participant.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ParticipantService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}
  private nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

  async createParticipant(party_id: string, createParticipantDto:createParticipantDto, user_uid: string ) {
    const code = this.nanoid();

    await this.verifyInviteToken(createParticipantDto.invite_token, party_id);

    return this.prisma.participant.create({
      data:{
        party_id: party_id,  
        code: code,
        role: createParticipantDto.role,
        user_uid: user_uid,
        transport_mode : createParticipantDto.transport_mode,
        start_address : createParticipantDto.start_address,
        start_lat : createParticipantDto.start_lat,
        start_lng : createParticipantDto.start_lng
      },
    });
  }

  async verifyInviteToken(token: string, party_id: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.INVITE_SECRET,
      });

      if (payload.party_id !== party_id) {
        throw new ForbiddenException('잘못된 초대 링크입니다.');
      }

      return true;
    } catch (err) {
      throw new ForbiddenException('초대 링크가 만료되었거나 유효하지 않습니다.');
    }
  }


  // findAll() {
  //   return `This action returns all participant`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} participant`;
  // }

  // update(id: number, updateParticipantDto: UpdateParticipantDto) {
  //   return `This action updates a #${id} participant`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} participant`;
  // }
}
