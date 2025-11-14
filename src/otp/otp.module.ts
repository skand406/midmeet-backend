import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { HttpModule } from '@nestjs/axios';
import { PartyModule } from 'src/party/party.module';
import { ParticipantService } from 'src/party/services/participant.service';
import { JwtModule } from '@nestjs/jwt';
import { RouteVisualizerService } from './route-visualizer.service';

@Module({
  imports: [HttpModule,PartyModule,JwtModule],
  controllers: [OtpController],
  providers: [OtpService,ParticipantService,RouteVisualizerService],
})
export class OtpModule {}
