import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { retry: 1, refetchOnWindowFocus: false },
	},
});

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<div className="flex h-screen items-center justify-center">
				<h1 className="text-2xl font-semibold">Network Intelligence Console</h1>
			</div>
		</QueryClientProvider>
	);
}

export default App;
