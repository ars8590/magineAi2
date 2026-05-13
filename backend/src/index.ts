import "dotenv/config";
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import generateRoute from './routes/generate';
import contentRoute from './routes/content';
import feedbackRoute from './routes/feedback';
import adminRoute from './routes/admin';
import authRoute from './routes/auth';
import libraryRoute from './routes/library';
import preferencesRoute from './routes/preferences';






const app = express();

app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('tiny'));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/generate', generateRoute);
app.use('/content', contentRoute);
app.use('/feedback', feedbackRoute);
app.use('/admin', adminRoute);
app.use('/auth', authRoute);
app.use('/library', libraryRoute);
app.use('/preferences', preferencesRoute);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected error' });
});


app.listen(config.port, () => {
  console.log(`MagineAI API running on port ${config.port}`);
});

