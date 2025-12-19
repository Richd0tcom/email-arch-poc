import { Module } from '@nestjs/common';
import { BenchmarkController } from './benchmark.controller';
import { BenchmarkService } from './benchmark.service';
import { S3Service } from './s3.service';

@Module({
  controllers: [BenchmarkController],
  providers: [BenchmarkService, S3Service],
})
export class BenchmarkModule {}