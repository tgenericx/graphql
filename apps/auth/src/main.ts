import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConsoleLogger, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: true,
      colors: true
    }),
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('AuthBootstrap');

  const RABBITMQ_URL = configService.get<string>(
    'RABBITMQ_URL',
    'amqps://guest:guest@localhost:5672',
  );
  const QUEUE_NAME = configService.get<string>('AUTH_QUEUE', 'auth_queue');
  const NODE_ENV = configService.get<string>('NODE_ENV', 'development');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [RABBITMQ_URL],
      queue: QUEUE_NAME,
      queueOptions: { durable: false },
    },
  });

  await app.startAllMicroservices();

  logger.log(`✅ Auth microservice running via RMQ`);
  logger.log(`🌐 Queue: ${QUEUE_NAME}`);
  logger.log(`🔌 Broker: ${RABBITMQ_URL}`);
  logger.log(`🌱 Environment: ${NODE_ENV}`);
}

bootstrap().catch((error) => {
  Logger.error('❌ Failed to bootstrap Auth microservice', error);
  process.exit(1);
});
