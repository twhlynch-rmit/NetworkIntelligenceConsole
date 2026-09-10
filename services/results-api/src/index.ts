import { createApp, SERVICE_NAME } from './app';
import { createLogger } from '@nic/shared';

const log = createLogger(SERVICE_NAME);
const app = createApp();
const port = Number(process.env.PORT) || 3005;

app.listen(port, () => {
	log.info('started', { port });
});
