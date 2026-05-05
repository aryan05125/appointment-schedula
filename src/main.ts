import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

// 🔥 LOAD ENV VARIABLES
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔥 GLOBAL VALIDATION (PRODUCTION READY)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // extra fields remove
      forbidNonWhitelisted: true, // invalid fields → error
      transform: true, // auto type conversion
    }),
  );

  // 🔥 CORS CONFIG (safer version)
  app.enableCors({
    origin: '*', // production ma specific domain mukvu
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // 🔥 PORT FROM ENV
  const port = process.env.PORT || 3000;

  await app.listen(port);

  // 🔥 CLEAN LOGS
  console.log('==============================');
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌐 URL: http://localhost:${port}`);
  console.log('==============================');
}

bootstrap();