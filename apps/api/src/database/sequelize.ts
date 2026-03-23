import { Sequelize } from 'sequelize';
import { env } from '../config/env';


export const sequelize = new Sequelize(env.MYSQL_DB, env.MYSQL_USER, env.MYSQL_PASSWORD, {
  host: env.MYSQL_HOST,
  port: parseInt(env.MYSQL_PORT, 10),
  dialect: 'mysql',
  logging: false, // set to console.log to see SQL queries
});

// We will sync models purely for Deliverable 1 ease of run,
// but the prompt mentions migrations are required.
// For initial setup, we will sync them in script.
