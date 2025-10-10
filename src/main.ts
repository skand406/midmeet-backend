
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';     // DTO 유효성 검사를 위한 파이프
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //swagger
  const config = new DocumentBuilder()
    .setTitle('MidMeet')
    .setDescription('MidMeet API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 요청에 포함된 쿠키를 파싱할 수 있게 등록
  app.use(cookieParser());

  // CORS 설정: 다른 도메인(frontend)에서 쿠키를 주고받을 수 있게 함
  app.enableCors({ origin: true, credentials: true });
  await app.listen(process.env.PORT ?? 300);
}
bootstrap();
  