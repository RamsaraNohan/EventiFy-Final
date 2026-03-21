import http from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { initSocket } from './socket';
import { sequelize } from './database/sequelize';

const server = http.createServer(app);

// Initialize real-time features
initSocket(server);

const PORT = env.PORT || 8000;

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    
    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to connect to the database or start server:', error);
    process.exit(1);
  }
}

startServer();
