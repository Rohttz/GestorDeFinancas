import 'dotenv/config';
import { DataSource } from 'typeorm';
import configuration from '../config/configuration';
import { join } from 'path';

const config = configuration();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  ssl: config.database.ssl,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: config.nodeEnv !== 'production',
});

export default AppDataSource;
