import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleSearchService } from './google-search.service';

@Module({
  imports: [ConfigModule],
  providers: [GoogleSearchService],
  exports: [GoogleSearchService],
})
export class GoogleSearchModule {}
