import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { FindIdDto } from './dto/find-id.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  
  async isCheckIdAvailable(id: string) {
    const found = await this.prisma.user.findUnique({ where: { id } });
    return { available: !found }; // null 이면 true
  }

  async findId(email: string) {
    const user = await this.prisma.user.findFirst({  where: { email }});

    if (!user) {
          return { id: "일치하는 사용자가 없습니다."};
    }
    return { id: user.id };
  }
 
}
