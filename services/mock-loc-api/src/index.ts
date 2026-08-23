import { createApp, SERVICE_NAME } from './app';

const app = createApp();
const port = Number(process.env.PORT) || 3006;

app.listen(port, () => {
	console.log(`${SERVICE_NAME} listening on port ${port}`);
});
