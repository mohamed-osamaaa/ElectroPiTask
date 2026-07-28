import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV as string,
  port: parseInt(process.env.PORT as string, 10) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'secretKey',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  database: {
    host: process.env.DB_HOST as string,
    port: parseInt(process.env.DB_PORT as string, 10) || 3306,
    username: process.env.DB_USERNAME as string,
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME as string,
    sync: process.env.DB_SYNC === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },
}));
