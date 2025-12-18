import { ForbiddenException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { FindIdDto } from './dto/find-id.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from 'src/auth/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async isCheckIdAvailable(id: string) {
    const found = await this.prisma.user.findUnique({ where: { id } });
    return { available: !found }; // null 이면 true
  }

  async findId(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user) {
      throw new NotFoundException('해당 이메일로 가입된 사용자가 없습니다.');
    }
    return { id: user.id };
  }

  async getUserInfo(uid: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { uid },
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
    return {
      message:
        '이메일 변경 요청이 접수되었습니다. 새로운 이메일로 인증 메일이 발송되었습니다.',
    };
  }

  async requestPasswordChange(body: { id: string; email: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: body.id,
        email: body.email,
      },
    });

    if (!user) {
      throw new NotFoundException(
        '입력한 아이디와 이메일이 일치하는 사용자가 없습니다.',
      );
    }

    await this.mail.sendPasswordResetMail(body.email, user.uid);
    return { message: '비밀번호 재설정 메일이 발송되었습니다.' };
  }

  async changePassword(
    uid: string,
    current_passwd: string,
    new_passwd: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { uid } });
    if (!user) {
      throw new NotFoundException('해당 사용자가 존재하지 않습니다.');
    }
    if (current_passwd === new_passwd) {
      throw new HttpException(
        '새 비밀번호는 현재 비밀번호와 다르게 설정해야 합니다.',
        411,
      );
    }

    // 현재 비밀번호 확인
    const isMatch = await bcrypt.compare(current_passwd, user.passwd);
    if (!isMatch) {
      throw new HttpException('현재 비밀번호가 일치하지 않습니다.', 412);
    }

    // 비밀번호 변경
    const PasswordHash = await bcrypt.hash(new_passwd, 10);
    await this.prisma.user.update({
      where: { uid },
      data: { passwd: PasswordHash },
    });

    return { message: '비밀번호가 변경되었습니다.' };
  }

  async deleteAccount(uid: string) {
    const user = await this.prisma.user.findUnique({ where: { uid } });
    if (!user) {
      throw new NotFoundException('해당 사용자가 존재하지 않습니다.');
    }

    await this.prisma.$transaction(async (prisma) => {
      const leaderParties = await prisma.participant.findMany({
        where: { user_uid: uid, role: 'LEADER' },
        select: { party_id: true },
      });
      for (const leaderParty of leaderParties) {
        await prisma.participant.deleteMany({
          where: { party_id: leaderParty.party_id },
        });
        await prisma.party.delete({
          where: { party_id: leaderParty.party_id },
        });
      }

      await prisma.participant.deleteMany({ where: { user_uid: uid } });
      await prisma.verificationToken.deleteMany({
        where: { userUid: uid },
      });
      // 필요한 다른 관련 데이터 삭제 작업 추가
      await this.prisma.user.delete({ where: { uid } });
    });
    return { message: '회원 탈퇴가 완료되었습니다.' };
  }

  async getUserVisits(uid: string) {
    const user = await this.prisma.user.findUnique({ where: { uid } });
    if (!user) {
      throw new NotFoundException('해당 사용자가 존재하지 않습니다.');
    }

    const partyIds = await this.prisma.participant.findMany({
      where: { user_uid: user.uid },
      select: { party_id: true },
    });

    const ids = partyIds.map((p) => p.party_id);
    const parties = await this.prisma.party.findMany({
      where: { party_id: { in: ids } },
      include: {
        courses: {
          select: {
            course_id: true,
            course_no: true,
            place_name: true,
            place_address: true,
          },
        },
        participants: {
          select: {
            user_uid: true,
            role: true,
          },
        },
      },
    });
    const result = parties.map((party) => ({
      ...party,
      myRole: party.participants.find((p) => p.user_uid === uid)?.role || null,
    }));

    return result;
  }
}
