import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BenchmarkModule } from './benchmark/benchmark.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BenchmarkModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
