type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	service: string;
	message: string;
	[key: string]: unknown;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function emit(entry: LogEntry): void {
	if (LEVEL_ORDER[entry.level] < LEVEL_ORDER[MIN_LEVEL]) return;
	console.log(JSON.stringify(entry));
}

export interface Logger {
	debug(message: string, context?: Record<string, unknown>): void;
	info(message: string, context?: Record<string, unknown>): void;
	warn(message: string, context?: Record<string, unknown>): void;
	error(message: string, context?: Record<string, unknown>): void;
}

export function createLogger(service: string): Logger {
	return {
		debug: (message, context) =>
			emit({
				timestamp: new Date().toISOString(),
				level: 'debug',
				service,
				message,
				...context,
			}),
		info: (message, context) =>
			emit({
				timestamp: new Date().toISOString(),
				level: 'info',
				service,
				message,
				...context,
			}),
		warn: (message, context) =>
			emit({
				timestamp: new Date().toISOString(),
				level: 'warn',
				service,
				message,
				...context,
			}),
		error: (message, context) =>
			emit({
				timestamp: new Date().toISOString(),
				level: 'error',
				service,
				message,
				...context,
			}),
	};
}
