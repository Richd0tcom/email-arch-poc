import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BenchmarkModule } from './benchmark/benchmark.module';

@Module({
  imports: [BenchmarkModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
