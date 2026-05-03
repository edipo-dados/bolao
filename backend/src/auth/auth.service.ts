import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    // Marcar como verificado (sem confirmação de email por enquanto)
    await this.usersService.update(user.id, { emailVerified: true });

    const token = this.generateToken(user.id, user.email, user.role);
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken: token,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerifyToken(token);
    if (!user) {
      throw new BadRequestException('Token inválido ou já utilizado');
    }

    await this.usersService.update(user.id, {
      emailVerified: true,
      verifyToken: null,
    });

    const jwtToken = this.generateToken(user.id, user.email, user.role);
    return {
      message: 'Email confirmado com sucesso!',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken: jwtToken,
    };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'Se o email existir, um novo link será enviado' };
    }
    if (user.emailVerified) {
      return { message: 'Email já confirmado' };
    }

    const verifyToken = uuidv4();
    await this.usersService.update(user.id, { verifyToken });
    await this.emailService.sendVerificationEmail(user.email, user.name, verifyToken);

    return { message: 'Novo email de confirmação enviado' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const token = this.generateToken(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
      accessToken: token,
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'Se o email existir, um link de recuperação será enviado' };
    }

    const resetToken = uuidv4();
    const resetTokenExp = new Date(Date.now() + 3600000); // 1 hora

    await this.usersService.update(user.id, {
      resetToken,
      resetTokenExp,
    });

    // Enviar email de reset
    await this.emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    return { message: 'Se o email existir, um link de recuperação será enviado' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExp: null,
    });

    return { message: 'Senha alterada com sucesso' };
  }

  private generateToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign({ sub: userId, email, role });
  }

  async changePassword(userId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('A senha deve ter pelo menos 6 caracteres');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(userId, {
      password: hashedPassword,
      mustChangePassword: false,
    });

    return { message: 'Senha alterada com sucesso' };
  }
}
