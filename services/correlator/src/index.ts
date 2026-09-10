import { createApp, SERVICE_NAME } from './app';
import { createLogger } from '@nic/shared';

export { SERVICE_NAME } from './app';

const log = createLogger(SERVICE_NAME);
const app = createApp();
const port = Number(process.env.PORT) || 3004;

app.listen(port, () => {
	log.info('started', { port });
});
