import express from 'express';
import routes from './routes/routes';
const app = express();
const PORT = 3003;

app.use(express.json());

app.use(routes);

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

export default app;
