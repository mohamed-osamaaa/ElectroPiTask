import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskHistory } from './entities/task-history.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { TasksGateway } from './tasks.gateway';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(TaskHistory)
    private taskHistoryRepository: Repository<TaskHistory>,
    private projectsService: ProjectsService,
    private usersService: UsersService,
    private tasksGateway: TasksGateway,
  ) {}

  async create(projectId: string, createTaskDto: CreateTaskDto, userId: string, role: string) {
    // Verify user has access to this project (throws if not)
    await this.projectsService.findOne(projectId, userId, role);

    if (createTaskDto.assigneeId) {
      const assignee = await this.usersService.findById(createTaskDto.assigneeId);
      if (!assignee) throw new BadRequestException('Assignee not found');

      const isAssigneeProjectMember = await this.projectsService.isMember(projectId, createTaskDto.assigneeId);
      if (!isAssigneeProjectMember) {
        throw new BadRequestException('Assignee must be a member of this project');
      }
    }

    const task = this.tasksRepository.create({
      ...createTaskDto,
      projectId,
      creatorId: userId,
    });

    const savedTask = await this.tasksRepository.save(task);
    
    // Notify connected clients
    this.tasksGateway.notifyTaskCreated(projectId, savedTask);
    
    return savedTask;
  }

  async findAll(projectId: string, filterDto: FilterTaskDto, userId: string, role: string) {
    // Verify access
    await this.projectsService.findOne(projectId, userId, role);

    const {
      status,
      priority,
      assigneeId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = filterDto;
    
    const query = this.tasksRepository.createQueryBuilder('task')
      .where('task.projectId = :projectId', { projectId });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }
    if (priority) {
      query.andWhere('task.priority = :priority', { priority });
    }
    if (assigneeId) {
      query.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }
    if (search?.trim()) {
      query.andWhere('(task.title LIKE :search OR task.description LIKE :search)', {
        search: `%${search.trim()}%`,
      });
    }

    query.skip((page - 1) * limit).take(limit);
    query.orderBy(`task.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    const [tasks, total] = await query.getManyAndCount();

    return {
      data: tasks,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async findOne(id: string, projectId: string, userId: string, role: string) {
    // Verify project access
    await this.projectsService.findOne(projectId, userId, role);

    const task = await this.tasksRepository.findOne({ where: { id, projectId } });
    if (!task) throw new NotFoundException('Task not found');
    
    return task;
  }

  async getHistory(id: string, projectId: string, userId: string, role: string) {
    // Verify project access
    await this.projectsService.findOne(projectId, userId, role);
    
    // Verify task exists in project
    await this.findOne(id, projectId, userId, role);

    return this.taskHistoryRepository.find({
      where: { taskId: id },
      relations: { changedBy: true },
      order: { changedAt: 'DESC' },
    });
  }

  async update(id: string, projectId: string, updateTaskDto: UpdateTaskDto, userId: string, role: string) {
    const task = await this.findOne(id, projectId, userId, role);

    const isAssignee = task.assigneeId === userId;
    const isAdmin = role === 'admin';

    // Only admin or the assigned member can update a task
    if (!isAdmin && !isAssignee) {
      throw new ForbiddenException('You do not have permission to edit this task');
    }

    if (updateTaskDto.assigneeId) {
      const assignee = await this.usersService.findById(updateTaskDto.assigneeId);
      if (!assignee) throw new BadRequestException('Assignee not found');

      const isAssigneeProjectMember = await this.projectsService.isMember(projectId, updateTaskDto.assigneeId);
      if (!isAssigneeProjectMember) {
        throw new BadRequestException('Assignee must be a member of this project');
      }
    }

    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      const history = this.taskHistoryRepository.create({
        taskId: task.id,
        projectId,
        oldStatus: task.status,
        newStatus: updateTaskDto.status,
        changedById: userId,
      });
      await this.taskHistoryRepository.save(history);
    }

    await this.tasksRepository.update(id, updateTaskDto);
    const updatedTask = await this.findOne(id, projectId, userId, role);
    
    // Notify connected clients
    this.tasksGateway.notifyTaskUpdated(projectId, updatedTask);
    
    return updatedTask;
  }

  async remove(id: string, projectId: string, userId: string, role: string) {
    await this.projectsService.findOne(projectId, userId, role);
    const task = await this.findOne(id, projectId, userId, role);

    const isAssignee = task.assigneeId === userId;
    const isAdmin = role === 'admin';

    // Only admin or the assigned member can delete a task
    if (!isAdmin && !isAssignee) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    await this.tasksRepository.delete(id);
    
    // Notify connected clients
    this.tasksGateway.notifyTaskDeleted(projectId, id);
    
    return { success: true };
  }
}
