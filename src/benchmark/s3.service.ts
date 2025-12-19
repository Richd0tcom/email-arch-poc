import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    // Get AWS configuration
    const region = this.configService.get('AWS_REGION', 'us-east-1');
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');


    const credentials = accessKeyId && secretAccessKey 
      ? { accessKeyId, secretAccessKey }
      : undefined;

    this.logger.log(`Initializing S3 client for region: ${region}`);
    if (credentials) {
      this.logger.log('Using explicit AWS credentials');
    } else {
      this.logger.log('Using AWS IAM role or environment credentials');
    }

    this.s3Client = new S3Client({
      region,
      credentials,
      // Optional: Configure retries and timeouts
      maxAttempts: 3,
    });
  }

  async getEmailFromS3(bucket: string, key: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Decode URL-encoded key if needed
      const decodedKey = decodeURIComponent(key.replace(/\+/g, ' '));
      
      this.logger.log(`Fetching from S3: ${bucket}/${decodedKey}`);
      
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: decodedKey,
      });

      const response = await this.s3Client.send(command);
      const content = await response?.Body?.transformToString();
      
      const downloadTime = Date.now() - startTime;
      this.logger.log(`S3 Download Time: ${downloadTime}ms for ${decodedKey}`);
      
      return content || ''
    } catch (error) {
      this.logger.error(`Failed to fetch from S3: ${error.message}`, error.stack);
      throw error;
    }
  }


  async listObjects(){
    const bucket = this.configService.get('S3_BUCKET');
    const ob = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'email'
    })
    const gg = await this.s3Client.send(ob)
    return gg
  }


  async getObject(){
    const bucket = this.configService.get('S3_BUCKET')

    const ob = new GetObjectCommand({
        Bucket: bucket,
        Key: 'email/e84n1mjighsqeb3mudsvpbvj86g0f94c7k39l901'
    })

    const gg = await this.s3Client.send(ob)
    return gg.Body?.transformToString()
  }
}