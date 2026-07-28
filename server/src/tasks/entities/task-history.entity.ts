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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'task_id' })
  taskId: number;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'enum', enum: TaskStatus, name: 'old_status' })
  oldStatus: TaskStatus;

  @Column({ type: 'enum', enum: TaskStatus, name: 'new_status' })
  newStatus: TaskStatus;

  @Column({ name: 'changed_by_id' })
  changedById: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy: User;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
