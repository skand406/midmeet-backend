import { Module } from '@nestjs/common';
import { PartyService } from './services/party.service';
import { PartyController } from './party.controller';
import { UserModule } from 'src/user/user.module';
import { ParticipantService } from './services/participant.service';
import { CourseService } from './services/course.service';

@Module({
  imports: [UserModule],
  controllers: [PartyController],
  providers: [PartyService,ParticipantService,CourseService],
})
export class PartyModule {}
