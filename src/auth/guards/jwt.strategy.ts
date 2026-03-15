import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/*
 * JwtStrategy est invoquée automatiquement par Passport lorsque JwtAuthGuard
 * intercepte une requête. Passport extrait le token Bearer, le vérifie avec
 * le secret, puis appelle validate() avec le payload décodé.
 * Le retour de validate() est injecté dans req.user.
 */

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: number; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}
