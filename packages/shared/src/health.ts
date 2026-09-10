export async function checkDependency(
	check: () => Promise<void>,
	timeoutMs = 2000,
): Promise<boolean> {
	try {
		await Promise.race([
			check(),
			new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
		]);
		return true;
	} catch {
		return false;
	}
}
