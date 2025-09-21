import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}
  //jwt 토큰 발급
  private sign(user: { uid: string; id: string }) {
    return this.jwt.signAsync({ sub: user.uid, id: user.id });
  }

  async signup(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.passwd, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwd : passwordHash,
          name: dto.name,
          phone: dto.phone,
          id : dto.id,
        },
        select: { 
          uid: true, 
          id: true, 
          email: true, 
          name: true, 
          phone: true, 
        },
      });
      const token = await this.sign({ uid: user.uid, id: user.id });
      return { user, token };
    } catch (e: any) {
      // Prisma unique constraint 위반 → 409 Conflict
      if (e?.code === 'P2002') {
        const fields = (e.meta?.target as string[])?.join(', ');
        throw new ConflictException(`${fields} already in use`); // 409
      }

      // Prisma 외 참조 무결성 위반 → 400 Bad Request
      if (e?.code === 'P2003') {
        throw new BadRequestException('Validation failed'); // 400
      }

      // 기타 Prisma에서 특정 리소스를 못 찾았을 때 → 403 또는 404로 매핑 가능
      if (e?.code === 'P2025') {
        throw new ForbiddenException('Forbidden'); // 403
      }

      // 예상치 못한 에러 → 500 Internal Server Error
      throw new InternalServerErrorException('Internal server error');
    }
  }

  //유저 검증
  async validateUser(id: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwd);
    if (!ok) return null;
    const { passwordHash, ...safe } = user as any;
    return safe; // {uid, loginId, email, ...}
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: dto.id } });
      if (!user) throw new UnauthorizedException('id-Invalid credentials');

      const ok = await bcrypt.compare(dto.passwd, user.passwd);
      if (!ok) throw new UnauthorizedException('passwd-Invalid credentials');

      const token = await this.sign({ uid: user.uid, id: user.id });
      return { token };

    } catch (e) {
      // 이미 우리가 의도적으로 던진 UnauthorizedException은 그대로 전달
      if (e instanceof UnauthorizedException) {
        throw e;
      }

      // 나머지(DB 끊김, bcrypt 내부 오류 등)는 500으로 통일
      throw new InternalServerErrorException('Server error during login');
    }
  }
}
