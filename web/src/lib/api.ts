export interface ServiceConfig {
	name: string;
	url: string;
	port: number;
}

export interface ServiceHealth extends ServiceConfig {
	status: 'healthy' | 'degraded' | 'unreachable';
	responseTimeMs: number;
	lastChecked: Date;
}

const BASE_SERVICES: ServiceConfig[] = [
	{
		name: 'Mock Outage API',
		url: import.meta.env.VITE_OUTAGE_API_URL || 'http://localhost:3001',
		port: 3001,
	},
	{
		name: 'Fleet Simulator',
		url: import.meta.env.VITE_FLEET_SIMULATOR_URL || 'http://localhost:3002',
		port: 3002,
	},
	{
		name: 'Public Data Adapter',
		url: import.meta.env.VITE_PUBLIC_DATA_ADAPTER_URL || 'http://localhost:3003',
		port: 3003,
	},
	{
		name: 'Correlator',
		url: import.meta.env.VITE_CORRELATOR_URL || 'http://localhost:3004',
		port: 3004,
	},
	{
		name: 'Results API',
		url: import.meta.env.VITE_RESULTS_API_URL || 'http://localhost:3005',
		port: 3005,
	},
	{
		name: 'Mock LOC API',
		url: import.meta.env.VITE_LOC_API_URL || 'http://localhost:3006',
		port: 3006,
	},
];

const HEALTH_PATHS: Record<string, string> = {
	'Mock Outage API': '/outage/v0/health-check',
	'Fleet Simulator': '/fleet-simulator/v0/health-check',
	'Public Data Adapter': '/public-data-adapter/v0/health-check',
	Correlator: '/correlator/v0/health-check',
	'Results API': '/results-api/v0/health-check',
	'Mock LOC API': '/health-check',
};

export async function fetchServiceHealth(service: ServiceConfig): Promise<ServiceHealth> {
	const healthPath = HEALTH_PATHS[service.name] || '/health-check';
	const url = `${service.url}${healthPath}`;
	const start = Date.now();

	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
		const elapsed = Date.now() - start;

		return {
			...service,
			status: res.status === 200 ? 'healthy' : 'degraded',
			responseTimeMs: elapsed,
			lastChecked: new Date(),
		};
	} catch {
		return {
			...service,
			status: 'unreachable',
			responseTimeMs: Date.now() - start,
			lastChecked: new Date(),
		};
	}
}

export function fetchAllServices(): Promise<ServiceHealth[]> {
	return Promise.all(BASE_SERVICES.map(fetchServiceHealth));
}
