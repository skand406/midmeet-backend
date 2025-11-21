import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  private transporter;

  constructor(private prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail', // 다른 SMTP도 가능
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendVerificationMail(to: string, uid: string) {
    //토큰 생성
    const { raw, hash } = this.generateToken();
    //DB에 토큰 저장
    await this.saveToken(uid, 'EMAIL', hash, 1000 * 60 * 10); // 10분
    //인증 링크
    const link = `${process.env.BACK_URL}/auth/verify-email?token=${raw}`;

    await this.transporter.sendMail({
      from: `"MidMeet" <${process.env.MAIL_USER}>`,
      to,
      subject: '이메일 인증을 완료해주세요',
      html: `
        <h2>이메일 인증</h2>
        <p>아래 링크를 클릭하면 인증이 완료됩니다.</p>
        <a href="${link}">${link}</a>
      `,
    });
  }

  async sendPasswordResetMail(to: string, uid: string) {
    const { raw, hash } = this.generateToken();
    await this.saveToken(uid, 'RESET', hash, 1000 * 60 * 10); // 10분

    const link = `${process.env.FRONT_URL}/Reset-passwd?token=${raw}`;

    await this.transporter.sendMail({
      from: `"MidMeet" <${process.env.MAIL_USER}>`,
      to,
      subject: '비밀번호 재설정 안내',
      html: `
        <h2>비밀번호 재설정</h2>
        <p>아래 링크를 클릭해 새 비밀번호를 설정하세요.</p>
        <a href="${link}">${link}</a>
      `,
    });
  }

  //토큰 생성
  generateToken() {
    const raw = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(raw).digest('hex');
    return { raw, hash };
  }
  // ✅ 토큰 저장
  async saveToken(userUid: string, type: string, hash: string, ttl: number) {
    return this.prisma.verificationToken.create({
      data: {
        token: hash,
        type,
        userUid,
        expiresAt: new Date(Date.now() + ttl),
      },
    });
  }

  // ✅ 토큰 검증
  async verifyToken(raw: string, type: string) {
    const hash = createHash('sha256').update(raw).digest('hex');
    const record = await this.prisma.verificationToken.findUnique({
      where: { token: hash },
    });

    if (!record) throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    if (record.type !== type) throw new BadRequestException('토큰 타입 불일치');
    if (record.expiresAt < new Date())
      throw new ConflictException('토큰 만료됨');
    if (record.usedAt) throw new GoneException('이미 사용된 토큰');

    return record;
  }

  // ✅ 토큰 사용 처리
  async markUsed(id: string) {
    return this.prisma.verificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async sendMidPointMail(to: string, party_id: string) {
    const link = `${process.env.FRONT_URL}/midpoint/${party_id}`;

    await this.transporter.sendMail({
      from: `"MidMeet" <${process.env.MAIL_USER}>`,
      to,
      subject: '모임이 입력을 완성하세요!',
      html: `
        <h2>모임 입력 완료!</h2>
        <p>모든 참여자가 출발지를 완성했습니다. 링크를 클릭해 모임을 완성해보세요!</p>
        <a href="${link}">${link}</a>
      `,
    });
  }

  async sendCompliteMail(to: string, party_id: string) {
    const link = `${process.env.FRONT_URL}/midpoint/result/${party_id}`;

    await this.transporter.sendMail({
      from: `"MidMeet" <${process.env.MAIL_USER}>`,
      to,
      subject: '모임이 완성되었습니다.',
      html: `
        <h2>모임 생성 완료</h2>
        <p>여러분을 위한 모임이 생성되었습니다. 지금 바로 확인해보세요!!</p>
        <a href="${link}">${link}</a>
      `,
    });
  }
}
