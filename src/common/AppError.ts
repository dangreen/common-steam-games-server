// tslint:disable: max-classes-per-file

export class AppError extends Error {}

export function isAppError(error: Error) {
	return error instanceof AppError;
}
