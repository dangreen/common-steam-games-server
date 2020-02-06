// tslint:disable: max-classes-per-file
import {
	Logger
} from '@nestjs/common';

export class AppError extends Error {}

export function isAppError(error: Error) {
	return error instanceof AppError;
}

export function printError(logger: Logger, error: any, context: string) {

	logger.error(
		error.message,
		error.stack,
		context
	);

	if (error.response) {
		logger.error(
			error.response.data,
			'',
			context
		);
	}
}
