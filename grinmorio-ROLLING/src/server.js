import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Prisma Client
const prisma = new PrismaClient();

async function connectWithRetry(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('Database connected successfully!');
      return;
    } catch (err) {
      console.error(
        `Database connection failed. Attempt ${i + 1} of ${retries}.`
      );
      if (i === retries - 1) {
        console.error('All database connection attempts failed.');
        process.exit(1);
      }
      const delay = Math.pow(2, i) * 1000;
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Graceful Shutdown
const server = app.listen(port, async () => {
  await connectWithRetry();
  console.log(`Server is running on port ${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});
