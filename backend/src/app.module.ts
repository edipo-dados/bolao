import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PoolsModule } from './pools/pools.module';
import { LeaguesModule } from './leagues/leagues.module';
import { MatchesModule } from './matches/matches.module';
import { PredictionsModule } from './predictions/predictions.module';
import { RankingModule } from './ranking/ranking.module';
import { FootballModule } from './football/football.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module';
import { ActivityLogInterceptor } from './common/activity-log.interceptor';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    PoolsModule,
    LeaguesModule,
    MatchesModule,
    PredictionsModule,
    RankingModule,
    FootballModule,
    AdminModule,
    NotificationsModule,
    EmailModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogInterceptor,
    },
  ],
})
export class AppModule {}
