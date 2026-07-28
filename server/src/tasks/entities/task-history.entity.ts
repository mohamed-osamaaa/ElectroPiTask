import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { User } from '../../users/entities/user.entity';

@Entity('task_history')
export class TaskHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id', type: 'varchar', length: 36 })
  taskId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'project_id', type: 'varchar', length: 36 })
  projectId: string;

  @Column({ type: 'enum', enum: TaskStatus, name: 'old_status' })
  oldStatus: TaskStatus;

  @Column({ type: 'enum', enum: TaskStatus, name: 'new_status' })
  newStatus: TaskStatus;

  @Column({ name: 'changed_by_id', type: 'varchar', length: 36 })
  changedById: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy: User;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
