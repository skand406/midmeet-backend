import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { FindIdDto } from './dto/find-id.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService
  ) {}
  
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

  async getUserInfo(uid: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { uid },
      select: {
        uid: true,
        id: true,
        email: true,
        name: true,
        phone: true, 
        },
    });

    if (!user) {
      throw new NotFoundException('User not found'); //404
    }
    return { user };
  }

  async updateUser(uid: string, data: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { uid },
      data,
      select: {
        uid: true,
        id: true,
        email: true,
        name: true,
        phone: true, 
      },
    }); 
    return { user };
  }

  async findById(uid: string) {
    const user = await this.prisma.user.findUnique({
      where: { uid },
    });
    return user;  
  }

  async requestEmailChange(uid: string, email: string) {
    await this.prisma.user.update({
      where: { uid: uid },
      data: { isVerified: false },
    });
    await this.mail.sendVerificationMail(email, uid);
    return { message: '이메일 변경 요청이 접수되었습니다. 새로운 이메일로 인증 메일이 발송되었습니다.' };
  }
}
