import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/*
 * JwtAuthGuard active la vérification JWT sur une route via @UseGuards().
 * Il délègue à Passport qui invoque JwtStrategy pour valider le token.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
