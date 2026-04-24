import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { healthRouter } from './routes/health.js';
import { realPriceRouter } from './routes/real-price.js';
import { earthquakeRouter } from './routes/earthquake.js';
import { parseTranscriptRouter } from './routes/parse-transcript.js';

const app = express();

const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api', realPriceRouter);
app.use('/api', earthquakeRouter);
app.use('/api', parseTranscriptRouter);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${port}`);
});
