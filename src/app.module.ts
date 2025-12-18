import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PartyModule } from './party/party.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, PartyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
