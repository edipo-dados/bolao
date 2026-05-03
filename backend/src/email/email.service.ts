import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private readonly fromEmail: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || '');
    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  }

  async sendVerificationEmail(to: string, name: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: `Bolão Futebol <${this.fromEmail}>`,
        to,
        subject: 'Confirme seu email - Bolão Futebol',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #f5f5f5; padding: 40px; border-radius: 12px;">
            <h1 style="color: #c9a84c; font-size: 24px; margin-bottom: 8px;">⚽ Bolão Futebol</h1>
            <p style="color: #999; font-size: 14px; margin-bottom: 24px;">Confirmação de email</p>
            <p style="font-size: 16px;">Olá <strong>${name}</strong>,</p>
            <p style="color: #ccc; font-size: 14px; line-height: 1.6;">
              Obrigado por se cadastrar! Clique no botão abaixo para confirmar seu email e ativar sua conta.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}" style="background: #f5f5f5; color: #0a0a0a; padding: 12px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 14px;">
                Confirmar Email
              </a>
            </div>
            <p style="color: #666; font-size: 12px;">
              Se você não criou esta conta, ignore este email.
            </p>
            <p style="color: #666; font-size: 12px;">
              Ou copie e cole este link: ${verifyUrl}
            </p>
          </div>
        `,
      });
      this.logger.log(`Email de verificação enviado para ${to}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar email para ${to}: ${error}`);
    }
  }

  async sendPasswordResetEmail(to: string, name: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.resend.emails.send({
        from: `Bolão Futebol <${this.fromEmail}>`,
        to,
        subject: 'Recuperação de senha - Bolão Futebol',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #f5f5f5; padding: 40px; border-radius: 12px;">
            <h1 style="color: #c9a84c; font-size: 24px; margin-bottom: 8px;">⚽ Bolão Futebol</h1>
            <p style="color: #999; font-size: 14px; margin-bottom: 24px;">Recuperação de senha</p>
            <p style="font-size: 16px;">Olá <strong>${name}</strong>,</p>
            <p style="color: #ccc; font-size: 14px; line-height: 1.6;">
              Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="background: #f5f5f5; color: #0a0a0a; padding: 12px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 14px;">
                Redefinir Senha
              </a>
            </div>
            <p style="color: #666; font-size: 12px;">
              Este link expira em 1 hora. Se você não solicitou, ignore este email.
            </p>
          </div>
        `,
      });
      this.logger.log(`Email de reset enviado para ${to}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar email de reset para ${to}: ${error}`);
    }
  }
}
