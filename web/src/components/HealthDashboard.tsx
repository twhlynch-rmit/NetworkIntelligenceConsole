import { useQuery } from '@tanstack/react-query';
import { fetchAllServices, type ServiceHealth } from '@/lib/api';

function StatusDot({ status }: { status: ServiceHealth['status'] }) {
	const color =
		status === 'healthy'
			? 'bg-green-500'
			: status === 'degraded'
				? 'bg-yellow-500'
				: 'bg-red-500';

	return (
		<span
			className={`inline-block h-3 w-3 rounded-full ${color}`}
			aria-label={`Status: ${status}`}
		/>
	);
}

function ServiceCard({ service }: { service: ServiceHealth }) {
	return (
		<div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4">
			<div className="flex items-center gap-3">
				<StatusDot status={service.status} />
				<div className="font-medium text-zinc-100">
					{service.name}
					<span className="text-zinc-500 font-mono"> :{service.port}</span>
				</div>
			</div>
			<div className="text-sm text-zinc-400">{service.responseTimeMs}ms</div>
		</div>
	);
}

export function HealthDashboard() {
	const { data: services } = useQuery({
		queryKey: ['health'],
		queryFn: fetchAllServices,
		refetchInterval: 5000,
		refetchOnWindowFocus: true,
	});

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
			<main className="w-full max-w-md space-y-3">
				{services?.map((service) => (
					<ServiceCard key={service.name} service={service} />
				))}
			</main>
		</div>
	);
}
