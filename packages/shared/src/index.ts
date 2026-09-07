export type ISODateString = string;

export interface ApiResponse<T> {
	data: T;
	error?: never;
}

export interface ApiErrorResponse {
	data?: never;
	error: {
		code: string;
		message: string;
	};
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

export { createLogger } from './logger';
export type { Logger } from './logger';
