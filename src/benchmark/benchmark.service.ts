import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from './s3.service';
import * as https from 'https';

@Injectable()
export class BenchmarkService {
  private readonly logger = new Logger(BenchmarkService.name);
  private metrics = {
    s3Approach: [] as number[],
    directSNSApproach: [] as number[],
  };

  constructor(private readonly s3Service: S3Service) {}

  async confirmSnsSubscription(payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = payload.SubscribeURL;
      
      https.get(url, (res) => {
        this.logger.log(`SNS subscription confirmed: ${res.statusCode}`);
        resolve();
      }).on('error', (err) => {
        this.logger.error('Failed to confirm subscription', err);
        reject(err);
      });
    });
  }

  async processS3Approach(snsPayload: any): Promise<any> {
    
    const message = JSON.parse(snsPayload.Message);
    
    // Extract S3 details from SES notification
    const s3Info = message?.receipt?.action?.bucketName 
      ? {
          bucket: message.receipt.action.bucketName,
          key: message.receipt.action.objectKey,
        }
      : null;

    if (!s3Info) {
      throw new Error('No S3 information in payload');
    }

    // Download and parse email from S3
    const emailContent = await this.s3Service.getEmailFromS3(s3Info.bucket, s3Info.key);

    const receiptTime = Date.now();
    
    const parsedEmail = this.parseEmail(emailContent);

    // Calculate timestamp differences
    const sesTimestamp = new Date(message.mail.timestamp).getTime();
    const s3StorageTime = receiptTime - sesTimestamp;

    // Log metrics
    this.metrics.s3Approach.push(s3StorageTime);
    this.logger.log(`S3 Storage Time: ${s3StorageTime}ms`);

    return {
      approach: 's3-storage',
      emailId: message.mail.messageId,
      size: parsedEmail.size,
      s3StorageLatency: s3StorageTime,
    //   parsed: parsedEmail,
    };
  }

  async processDirectSNSApproach(snsPayload: any): Promise<any> {
    const receiptTime = Date.now();
    const message = JSON.parse(snsPayload.Message);
    
    // Direct SNS contains email content in message.content
    const emailContent = message?.content || snsPayload.Message;
    const parsedEmail = this.parseEmail(emailContent);

    // Calculate processing time
    const sesTimestamp = new Date(message.mail?.timestamp || new Date()).getTime();
    const processingTime = receiptTime - sesTimestamp;

    // Log metrics
    this.metrics.directSNSApproach.push(processingTime);
    this.logger.log(`Direct SNS Processing Time: ${processingTime}ms`);

    return {
      approach: 'direct-sns',
      emailId: message.mail?.messageId || 'unknown',
      size: parsedEmail.size,
      processingLatency: processingTime,
    //   parsed: parsedEmail,
    };
  }

  private parseEmail(emailContent: string | Buffer): any {
    const content = emailContent.toString();
    
    // Simple email parsing (extract headers and body)
    const lines = content.split('\n');
    const headers: Record<string, string> = {};
    let body = '';
    let inBody = false;

    for (const line of lines) {
      if (!inBody && line.trim() === '') {
        inBody = true;
        continue;
      }

      if (!inBody) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
          const key = line.slice(0, colonIndex).trim();
          const value = line.slice(colonIndex + 1).trim();
          headers[key.toLowerCase()] = value;
        }
      } else {
        body += line + '\n';
      }
    }

    return {
      from: headers['from'],
      to: headers['to'],
      subject: headers['subject'],
      date: headers['date'],
      body: body.trim(),
      size: Buffer.byteLength(content),
      rawHeaders: headers,
    };
  }

  getMetrics() {
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b) / arr.length : 0;
    
    return {
      s3Approach: {
        count: this.metrics.s3Approach.length,
        averageLatency: avg(this.metrics.s3Approach),
        latencies: this.metrics.s3Approach,
      },
      directSNSApproach: {
        count: this.metrics.directSNSApproach.length,
        averageLatency: avg(this.metrics.directSNSApproach),
        latencies: this.metrics.directSNSApproach,
      },
    };
  }
}