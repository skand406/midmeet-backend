import { Module } from '@nestjs/common';
import { PartyService } from './services/party.service';
import { PartyController } from './party.controller';
import { UserModule } from 'src/user/user.module';
import { ParticipantService } from './services/participant.service';
import { CourseService } from './services/course.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { MapService } from './services/map.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [UserModule, JwtModule, HttpModule],
  controllers: [PartyController],
  providers: [PartyService,ParticipantService,CourseService,MapService],
})
export class PartyModule {}
