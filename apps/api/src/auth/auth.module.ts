import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';
import { TokenService } from './token.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtGuard],
  // JwtModule is re-exported so JwtGuard (Task 6, in ListingsModule) can inject
  // JwtService after importing AuthModule. JwtGuard itself is exported so other
  // modules can use it directly via @UseGuards(JwtGuard).
  exports: [TokenService, JwtModule, JwtGuard],
})
export class AuthModule {}
