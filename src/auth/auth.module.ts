import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Patient } from '../patient/patient.entity';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // 🔥 FIX: User → Patient
    TypeOrmModule.forFeature([Patient]),

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}