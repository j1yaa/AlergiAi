import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { authMiddleware } from './auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Apply auth middleware to all /api routes except login
app.use('/api', (req, res, next) => {
  if (req.path === '/auth/login') {
    return next();
  }
  authMiddleware(req, res, next);
});

app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`AllergyAI Server running on http://localhost:${PORT}`);
});