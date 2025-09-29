import { Module } from '@nestjs/common';
import { PartyService } from './party.service';
import { PartyController } from './party.controller';
import { ParticipantModule } from 'src/participant/participant.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [ParticipantModule,UserModule],
  controllers: [PartyController],
  providers: [PartyService],
})
export class PartyModule {}
