import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'a8788c99b7f87f1d1288d6b354065223660e50e9d6d3b22a0ec390c8d7c6db85',
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email };
  }
}
