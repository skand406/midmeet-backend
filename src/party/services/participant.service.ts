import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleType } from '@prisma/client';
import { createParticipantDto } from '../dto/create-participant.dto';
import { JwtService } from '@nestjs/jwt';
import { UpdateParticipantDto } from '../dto/update-participant.dto';
import { MapService } from '../../party/services/map.service';

@Injectable()
export class ParticipantService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mapService: MapService
  ) {}

  async createLeaderParticipant(party_id:string, uid:string){
    const code = 'ABCDEFG';

    return await this.prisma.participant.create({
      data:{
        party_id:party_id,
        code:code,
        role : 'LEADER',
        user_uid: uid
      }
    })
  }

  async createMemberParticipant(party_id: string, createParticipantDto:createParticipantDto, user_uid: string ) {
    const code = 'ABCDEFG';
    const { EPSG_4326_X: lng, EPSG_4326_Y: lat } = await this.mapService.getCoordinates(createParticipantDto.start_address);


    const participant =  await this.prisma.participant.upsert({
      where: { party_id_user_uid: { party_id, user_uid } },
      update: {
        transport_mode: createParticipantDto.transport_mode,
        start_address: createParticipantDto.start_address,
        start_lat: lat,
        start_lng: lng,
      },
      create: {
        party_id,
        code,
        role: 'MEMBER',
        user_uid,
        transport_mode: createParticipantDto.transport_mode,
        start_address: createParticipantDto.start_address,
        start_lat: lat,
        start_lng: lng,
      },
    });
    console.log(participant)
    return participant;
  }

  async verifyInviteToken(token: string, party_id: string) {
    try {
      
      const payload = this.jwtService.verify(token, {
        secret: process.env.INVITE_SECRET,
      });

      if (payload.party_id !== party_id) {
        throw new ForbiddenException('잘못된 초대 링크입니다.');
      }
      const party_name = await this.prisma.party.findUnique({
                                      where :{party_id},
                                      select:{party_name:true}
                                    });
      //console.log(party_name)
      return  party_name;
    } catch (err) {
      throw err;
    }
  }


  // findAll() {
  //   return `This action returns all participant`;
  // }

  async findOne(uid: string, party_id:string) {
    return await this.prisma.participant.findUnique({
      where:{party_id_user_uid:{party_id,user_uid:uid}}
    })
  }

  async updateParticipant(uid:string, party_id:string, updateParticipantDto: UpdateParticipantDto) {
    const { EPSG_4326_X: lat, EPSG_4326_Y: lng } = await this.mapService.getCoordinates(updateParticipantDto.start_address);

    return await this.prisma.participant.update({
      where:{party_id_user_uid:{party_id, user_uid:uid}},
      data: {
        transport_mode : updateParticipantDto.transport_mode,
        start_address : updateParticipantDto.start_address,
        start_lat : lat,
        start_lng : lng
      }
    });
  }

  // remove(id: number) {
  //   return `This action removes a #${id} participant`;
  // }
}
