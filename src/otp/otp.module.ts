import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { HttpModule } from '@nestjs/axios';
import { PartyModule } from 'src/party/party.module';

@Module({
  imports: [HttpModule,PartyModule],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
