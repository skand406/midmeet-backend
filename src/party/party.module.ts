import { Module } from '@nestjs/common';
import { PartyService } from './services/party.service';
import { PartyController } from './party.controller';
import { UserModule } from 'src/user/user.module';
import { ParticipantService } from './services/participant.service';
import { CourseService } from './services/course.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [UserModule, JwtModule],
  controllers: [PartyController],
  providers: [PartyService,ParticipantService,CourseService],
})
export class PartyModule {}
