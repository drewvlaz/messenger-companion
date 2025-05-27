import app from './app';
import { config } from './config';

const server = app.listen(config.port, () => {
    console.log(`Server now listening on port ${config.port}`);
});

export default server;
