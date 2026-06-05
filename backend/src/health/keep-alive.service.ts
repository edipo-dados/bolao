import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

/**
 * Pinga o próprio servidor a cada 14 minutos para evitar que o Render durma.
 */
@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  @Cron('0 */14 * * * *') // A cada 14 minutos
  async ping() {
    const url = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL;
    if (!url) return; // Só roda em produção

    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) {
        this.logger.debug('Keep-alive ping OK');
      }
    } catch (err) {
      this.logger.warn(`Keep-alive falhou: ${err}`);
    }
  }
}
