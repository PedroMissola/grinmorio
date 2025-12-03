const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { globalErrorHandler } = require('./utils/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const { authenticateToken, authorizeRole } = require('./middleware/auth');

require('dotenv').config();

const connectDB = require('./config/db');
const { connectRedis, getRedisClient } = require('./config/redis');

const app = express();

async function initializeConnections() {
    await connectDB();
    connectRedis();
}
initializeConnections();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(rateLimiter(100, 60));

app.get('/health', (req, res) => {
    const dbStatus = {
        mongodb: connectDB ? connectDB.state === 1 ? 'UP' : 'DOWN' : 'N/A',
        redis: getRedisClient() && getRedisClient().status === 'ready' ? 'UP' : 'DOWN',
        api: 'UP',
    };
    const statusCode = dbStatus.mongodb === 'UP' && dbStatus.redis !== 'DOWN' ? 200 : 503;
    res.status(statusCode).json(dbStatus);
});

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Grinmorio API! Use /health for status.' });
});


app.get('/api/admin-stats', authenticateToken, authorizeRole('coordenador'), (req, res) => {
    res.json({ 
        message: 'Acesso Administrativo Concedido.',
        user: req.user,
        stats: { total: 42, secrets: 'private_data' }
    });
});

app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server Express is running on port ${PORT}.`);
});