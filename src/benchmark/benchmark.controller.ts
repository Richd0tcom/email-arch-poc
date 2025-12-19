import { Controller, Post, Body, Headers, Logger, Get, Request } from '@nestjs/common';
import { BenchmarkService } from './benchmark.service';

@Controller('benchmark')
export class BenchmarkController {
  private readonly logger = new Logger(BenchmarkController.name);

  constructor(private readonly benchmarkService: BenchmarkService) {}

  // Endpoint for Approach 1: SNS notification about S3 stored email
  @Post('s3-approach')
  async handleS3Approach(
    @Body() snsPayload: any,
    @Headers('x-amz-sns-message-type') messageType: string,

  ) {
    const startTime = Date.now();
    
    // SNS sends subscription confirmation first
    if (messageType === 'SubscriptionConfirmation') {
      this.logger.log('Confirming SNS subscription for S3 approach');
      await this.benchmarkService.confirmSnsSubscription(snsPayload);
      return { status: 'subscription confirmed' };
    }

    // Process notification
    const result = await this.benchmarkService.processS3Approach(snsPayload);
    
    const latency = Date.now() - startTime;
    this.logger.log(`S3 Approach Latency: ${latency}ms`);
    
    return { ...result, latency };
  }

  // Endpoint for Approach 2: Direct SNS with email content
  @Post('direct-sns-approach')
  async handleDirectSNSApproach(
    @Body() snsPayload: any,
    @Headers('x-amz-sns-message-type') messageType: string,
  ) {
    const startTime = Date.now();
    
    if (messageType === 'SubscriptionConfirmation') {
      this.logger.log('Confirming SNS subscription for direct approach');
      await this.benchmarkService.confirmSnsSubscription(snsPayload);
      return { status: 'subscription confirmed' };
    }

    const result = await this.benchmarkService.processDirectSNSApproach(snsPayload);
    
    const latency = Date.now() - startTime;
    this.logger.log(`Direct SNS Approach Latency: ${latency}ms`);
    
    return { ...result, latency };
  }

  // Simple health check
  @Post('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }


  @Get('metrics')
  getMetrics() {
    return this.benchmarkService.getMetrics();
  }

  @Get('list-objects')
  listObjects() {
    return this.benchmarkService.listObjects();
  }

  @Get('get-obj')
  getObj() {
    return this.benchmarkService.getObject();
  }
}