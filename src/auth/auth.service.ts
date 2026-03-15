import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { User } from 'src/user/user.entity';
import { randomUUID } from 'crypto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private userService: UserService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {}

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userService.findByEmail(dto.email);
    const valid = user
      ? await bcrypt.compare(dto.password, user.password)
      : false;

    if (!user || !valid)
      throw new UnauthorizedException('Identifiants invalides');

    return this.generateTokens(user);
  }
  async logout(userId: number, refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token: refreshToken, userId });
  }
  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const exists = await this.userService.findByEmail(dto.email);
    if (exists) throw new ConflictException('Cet email est déjà utilisé.');
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.create({
      email: dto.email,
      password: hashed,
    });
    return this.generateTokens(user);
  }

  //Utilitaires
  //Sign accesToken - add random refreshtoken
  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ?? '15m') as any,
      },
    );

    // Supprime les tokens excédentaires si l'user en a déjà 5
    const tokens = await this.refreshTokenRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'ASC' },
    });
    if (tokens.length >= 5) {
      await this.refreshTokenRepository.delete(tokens[0].id);
    }

    const refreshToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.save({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  //REFRESH
  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      if (tokenRecord) await this.refreshTokenRepository.delete(tokenRecord.id);
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    //Rotation: chaque refresh génère un nouveau pair de tokens,
    //L'ancien refreshToken est invalidé immédiatement
    await this.refreshTokenRepository.delete(tokenRecord.id);
    return this.generateTokens(tokenRecord.user);
  }
}
