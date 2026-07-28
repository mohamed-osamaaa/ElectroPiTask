import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { TaskHistory } from './entities/task-history.entity';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { TasksGateway } from './tasks.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskHistory]), ProjectsModule, UsersModule],
  controllers: [TasksController],
  providers: [TasksService, TasksGateway],
})
export class TasksModule {}
