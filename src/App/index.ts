import 'dotenv/config';
import {
	NestFactory
} from '@nestjs/core';
import {
	ValidationPipe
} from '@nestjs/common';
import {
	NestFastifyApplication,
	FastifyAdapter
} from '@nestjs/platform-fastify';
import {
	SwaggerModule,
	DocumentBuilder
} from '@nestjs/swagger';
import cors from 'fastify-cors';
import AppModule from './AppModule';

async function bootstrap() {

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter()
	);

	app.register(cors, {
		origin:      true,
		credentials: true
	});

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true
		})
	);

	bootstrapSwagger(app);

	await app.listen(Number(process.env.APP_PORT), '0.0.0.0');
}

function bootstrapSwagger(app: NestFastifyApplication) {

	const options = new DocumentBuilder()
		.setTitle('Common Steam Games')
		.setDescription('Common Steam Games API spec')
		.setVersion('1.0')
		.build();
	const document = SwaggerModule.createDocument(app, options);

	SwaggerModule.setup('swagger', app, document);
}

bootstrap();
