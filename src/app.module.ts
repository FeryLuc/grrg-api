import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService)=>({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities:[__dirname + '/**/*.entity{.ts, .js}'],
        synchronize: true,
      }),
      inject: [ConfigService]
    }),
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
