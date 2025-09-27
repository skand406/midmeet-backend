import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { FindIdDto } from './dto/find-id.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from 'src/mail/mail.service';
import * as bcrypt from 'bcrypt';

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
          throw new NotFoundException('해당 이메일로 가입된 사용자가 없습니다.');
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

  async requestPasswordChange(body: { id: string, email: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: body.id } });
    if (!user ) {
      throw new NotFoundException('해당 사용자 정보가 존재하지 않습니다.');
    }

    await this.mail.sendPasswordResetMail(body.email, user.uid);
    return { message: '비밀번호 재설정 메일이 발송되었습니다.' };
  }

  async changePassword(uid: string, current_passwd: string, new_passwd: string) {
    const user = await this.prisma.user.findUnique({ where: { uid } });
    if (!user) {
      throw new NotFoundException('해당 사용자가 존재하지 않습니다.');
    }
    if(current_passwd===new_passwd){
      throw new ForbiddenException('새 비밀번호는 현재 비밀번호와 다르게 설정해야 합니다.');
    }

    // 현재 비밀번호 확인
    const isMatch = await bcrypt.compare(current_passwd, user.passwd);
    if (!isMatch) {
      throw new ForbiddenException('현재 비밀번호가 일치하지 않습니다.');
    }

    // 비밀번호 변경    
    const PasswordHash = await bcrypt.hash(new_passwd, 10);
    await this.prisma.user.update({
      where: { uid },
      data: { passwd: PasswordHash },
    });

    return { message: '비밀번호가 변경되었습니다.' };
  }
}
