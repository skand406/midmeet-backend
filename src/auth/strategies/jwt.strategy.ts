import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // 토큰을 가져오는 방법 정의 (헤더)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // 만료된 토큰 거부
      secretOrKey: process.env.JWT_SECRET, // 토큰 서명 검증용 키
    });
  }

  // 토큰이 유효하면 payload를 request.user에 붙여줌
  async validate(payload: { sub: string; id: string }) {
    return { uid: payload.sub, id: payload.id };
  }
}
