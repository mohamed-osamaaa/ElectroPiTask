import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST as string,
  port: parseInt(process.env.DB_PORT as string, 10) || 3306,
  username: process.env.DB_USERNAME as string,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME as string,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
});

async function seed() {
  await dataSource.initialize();
  console.log('Database connected');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    const salt = await bcrypt.genSalt();
    const adminPassword = await bcrypt.hash('Admin@123', salt);
    const memberPassword = await bcrypt.hash('Member@123', salt);

    // Create Admin
    await queryRunner.query(
      `INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      ['Admin User', 'admin@demo.com', adminPassword, 'admin']
    );

    // Create Member
    await queryRunner.query(
      `INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      ['Member User', 'member@demo.com', memberPassword, 'member']
    );

    console.log('Seed completed: Admin and Member users created.');
    console.log('  Admin:  admin@demo.com  /  Admin@123');
    console.log('  Member: member@demo.com /  Member@123');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seed();
