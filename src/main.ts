import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });


  app.use((req, res, next) => {
    req.setTimeout(30000); // 30 seconds
    next();
  });

  await app.listen(process.env.PORT ?? 3000);

  const logger = new Logger('Bootstrap');
  logger.log(`Application running on port ${process.env.PORT ?? 3000}`);
  logger.log('Endpoints available:');
  logger.log(`  POST /benchmark/s3-approach`);
  logger.log(`  POST /benchmark/direct-sns-approach`);
  logger.log(`  POST /benchmark/health`);
}
bootstrap();
