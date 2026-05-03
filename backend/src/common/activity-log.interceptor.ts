import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

const ACTION_MAP: Record<string, string> = {
  'POST /api/auth/register': 'Cadastrou nova conta',
  'POST /api/auth/login': 'Fez login',
  'POST /api/auth/forgot-password': 'Solicitou recuperação de senha',
  'POST /api/auth/change-password': 'Alterou a senha',
  'POST /api/pools': 'Criou um bolão',
  'PUT /api/pools/:id': 'Editou um bolão',
  'DELETE /api/pools/:id': 'Excluiu um bolão',
  'POST /api/pools/:id/join': 'Solicitou entrada em bolão',
  'POST /api/pools/:id/leave': 'Saiu de um bolão',
  'POST /api/pools/:id/participants/:participantId/approve': 'Aprovou participante',
  'POST /api/pools/:id/participants/:participantId/reject': 'Rejeitou participante',
  'PUT /api/pools/:id/rules': 'Atualizou regras do bolão',
  'POST /api/predictions': 'Registrou palpite',
  'POST /api/admin/matches': 'Criou jogo manualmente',
  'POST /api/admin/matches/:id/result': 'Inseriu resultado de jogo',
  'DELETE /api/admin/matches/:id': 'Removeu jogo',
  'POST /api/admin/users/:id/reset-password': 'Resetou senha de usuário',
  'DELETE /api/admin/users/:id': 'Removeu usuário',
  'DELETE /api/admin/pools/:id': 'Removeu bolão (admin)',
  'POST /api/admin/espn/sync-leagues': 'Importou ligas ESPN',
  'POST /api/admin/espn/sync-fixtures/:leagueId': 'Sincronizou jogos ESPN',
  'POST /api/admin/leagues': 'Criou campeonato',
};

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.route?.path || request.url;
    const routeKey = `${method} ${url}`;

    return next.handle().pipe(
      tap(async () => {
        // Só loga ações mapeadas (ignora GETs e rotas não mapeadas)
        const action = this.findAction(routeKey, method, url);
        if (!action) return;

        const userId = request.user?.id || null;
        const details = this.buildDetails(request, routeKey);

        try {
          await this.prisma.activityLog.create({
            data: { userId, action, details },
          });
        } catch {
          // Silenciar erros de log para não afetar a resposta
        }
      }),
    );
  }

  private findAction(routeKey: string, method: string, url: string): string | null {
    // Match direto
    if (ACTION_MAP[routeKey]) return ACTION_MAP[routeKey];

    // Match com parâmetros (substituir :param por valores reais)
    for (const [pattern, action] of Object.entries(ACTION_MAP)) {
      const regex = new RegExp(
        '^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$',
      );
      if (regex.test(routeKey)) return action;
    }

    // Logar qualquer POST/PUT/DELETE não mapeado
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      return `${method} ${url}`;
    }

    return null;
  }

  private buildDetails(request: any, routeKey: string): string {
    const parts: string[] = [];

    // Info do body (sem dados sensíveis)
    if (request.body) {
      if (request.body.email) parts.push(`email: ${request.body.email}`);
      if (request.body.name && !request.body.password) parts.push(`nome: ${request.body.name}`);
      if (request.body.poolId) parts.push(`bolão: ${request.body.poolId}`);
      if (request.body.matchId) parts.push(`jogo: ${request.body.matchId}`);
    }

    // Info dos params
    if (request.params?.id) parts.push(`id: ${request.params.id}`);

    // IP
    const ip = request.headers['x-forwarded-for'] || request.ip;
    if (ip) parts.push(`ip: ${ip}`);

    return parts.join(' | ') || undefined as any;
  }
}
