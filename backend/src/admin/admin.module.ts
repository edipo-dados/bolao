import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { PoolsModule } from '../pools/pools.module';
import { MatchesModule } from '../matches/matches.module';
import { RankingModule } from '../ranking/ranking.module';
import { FootballModule } from '../football/football.module';

@Module({
  imports: [UsersModule, PoolsModule, MatchesModule, RankingModule, FootballModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
