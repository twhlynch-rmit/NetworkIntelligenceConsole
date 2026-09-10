import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HealthDashboard } from '@/components/HealthDashboard';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { retry: 1, refetchOnWindowFocus: false },
	},
});

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<HealthDashboard />
		</QueryClientProvider>
	);
}

export default App;
