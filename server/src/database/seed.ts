import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as crypto from 'crypto';

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

    // Generate IDs
    const adminId = crypto.randomUUID();
    const member1Id = crypto.randomUUID();
    const member2Id = crypto.randomUUID();
    const member3Id = crypto.randomUUID();
    const member4Id = crypto.randomUUID();
    const member5Id = crypto.randomUUID();

    console.log('Cleaning up existing data...');
    // Optional: We can delete existing data to prevent unique constraints or just rely on INSERT IGNORE
    // But since we want consistent relationships, let's just insert new interconnected data.
    
    console.log('Seeding Users...');
    const users = [
      [adminId, 'Admin User', 'admin@demo.com', adminPassword, 'admin'],
      [member1Id, 'Mohamed Osama', 'mohamed@demo.com', memberPassword, 'member'],
      [member2Id, 'Ahmed Ali', 'ahmed@demo.com', memberPassword, 'member'],
      [member3Id, 'Sara Youssef', 'sara@demo.com', memberPassword, 'member'],
      [member4Id, 'Laila Mahmoud', 'laila@demo.com', memberPassword, 'member'],
      [member5Id, 'Omar Khaled', 'omar@demo.com', memberPassword, 'member'],
    ];

    for (const user of users) {
      await queryRunner.query(
        `INSERT IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
        user
      );
    }

    console.log('Seeding Projects...');
    const project1Id = crypto.randomUUID();
    const project2Id = crypto.randomUUID();
    const project3Id = crypto.randomUUID();

    const projects = [
      [project1Id, 'Website Redesign', 'Redesigning the corporate website', adminId],
      [project2Id, 'Mobile App Launch', 'Q3 Mobile app development and launch', adminId],
      [project3Id, 'Internal Dashboard', 'Dashboard for employee metrics', member1Id],
    ];

    for (const project of projects) {
      await queryRunner.query(
        `INSERT IGNORE INTO projects (id, name, description, owner_id) VALUES (?, ?, ?, ?)`,
        project
      );
    }

    console.log('Seeding Project Members...');
    const projectMembers = [
      // Project 1 members
      [crypto.randomUUID(), project1Id, adminId],
      [crypto.randomUUID(), project1Id, member1Id],
      [crypto.randomUUID(), project1Id, member2Id],
      [crypto.randomUUID(), project1Id, member3Id],
      // Project 2 members
      [crypto.randomUUID(), project2Id, adminId],
      [crypto.randomUUID(), project2Id, member4Id],
      [crypto.randomUUID(), project2Id, member5Id],
      // Project 3 members
      [crypto.randomUUID(), project3Id, member1Id],
      [crypto.randomUUID(), project3Id, member2Id],
      [crypto.randomUUID(), project3Id, member5Id],
    ];

    for (const pm of projectMembers) {
      await queryRunner.query(
        `INSERT IGNORE INTO project_members (id, project_id, user_id) VALUES (?, ?, ?)`,
        pm
      );
    }

    console.log('Seeding Tasks...');
    const tasks = [
      // Project 1 Tasks
      [crypto.randomUUID(), 'Design Homepage Mockup', 'Create Figma designs for the new homepage', 'done', 'high', project1Id, adminId, member1Id],
      [crypto.randomUUID(), 'Implement Header', 'Develop the responsive header component', 'in_progress', 'medium', project1Id, adminId, member2Id],
      [crypto.randomUUID(), 'Footer Integration', 'Add footer links and styling', 'todo', 'low', project1Id, adminId, member3Id],
      [crypto.randomUUID(), 'SEO Optimization', 'Ensure meta tags and semantics are correct', 'todo', 'high', project1Id, adminId, null], // Unassigned
      [crypto.randomUUID(), 'Write Copy', 'Content for about us page', 'todo', 'medium', project1Id, adminId, null], // Unassigned

      // Project 2 Tasks
      [crypto.randomUUID(), 'Setup React Native Init', 'Initialize the mobile project', 'done', 'high', project2Id, adminId, adminId],
      [crypto.randomUUID(), 'Auth Screens', 'Login and Signup UI', 'in_progress', 'high', project2Id, adminId, member4Id],
      [crypto.randomUUID(), 'Profile Screen', 'User profile settings', 'todo', 'medium', project2Id, adminId, member5Id],
      [crypto.randomUUID(), 'Push Notifications', 'Integrate Firebase push notifications', 'todo', 'high', project2Id, adminId, null], // Unassigned

      // Project 3 Tasks
      [crypto.randomUUID(), 'Database Schema', 'Design metrics tables', 'done', 'high', project3Id, member1Id, member1Id],
      [crypto.randomUUID(), 'API Endpoints', 'Create REST APIs for charts', 'in_progress', 'high', project3Id, member1Id, member2Id],
      [crypto.randomUUID(), 'Frontend Charts', 'Integrate Chart.js', 'todo', 'medium', project3Id, member1Id, member5Id],
      [crypto.randomUUID(), 'QA Testing', 'Test the dashboard with dummy data', 'todo', 'medium', project3Id, member1Id, null], // Unassigned
    ];

    for (const task of tasks) {
      await queryRunner.query(
        `INSERT IGNORE INTO tasks (id, title, description, status, priority, project_id, creator_id, assignee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        task
      );
    }

    console.log('Seed completed successfully!');
    console.log('  Admin:          admin@demo.com    / Admin@123');
    console.log('  Mohamed Osama:  mohamed@demo.com  / Member@123');
    console.log('  Ahmed Ali:      ahmed@demo.com    / Member@123');
    console.log('  Sara Youssef:   sara@demo.com     / Member@123');
    console.log('  Laila Mahmoud:  laila@demo.com    / Member@123');
    console.log('  Omar Khaled:    omar@demo.com     / Member@123');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seed();
