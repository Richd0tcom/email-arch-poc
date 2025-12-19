import { Injectable, Logger } from '@nestjs/common';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;

  constructor() {
    
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async getEmailFromS3(bucket: string, key: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const content = await response?.Body?.transformToString();
      
      const downloadTime = Date.now() - startTime;
      this.logger.log(`S3 Download Time: ${downloadTime}ms for ${key}`);
      
      return content || '';
    } catch (error) {
      this.logger.error(`Failed to fetch from S3: ${error.message}`);
      throw error;
    }
  }
}