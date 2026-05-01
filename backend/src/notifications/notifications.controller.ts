import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificações' })
  getAll(@CurrentUser() user: any) {
    return this.notificationsService.getAll(user.id);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Notificações não lidas' })
  getUnread(@CurrentUser() user: any) {
    return this.notificationsService.getUnread(user.id);
  }

  @Get('count')
  @ApiOperation({ summary: 'Contagem de não lidas' })
  countUnread(@CurrentUser() user: any) {
    return this.notificationsService.countUnread(user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Marcar como lida' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
