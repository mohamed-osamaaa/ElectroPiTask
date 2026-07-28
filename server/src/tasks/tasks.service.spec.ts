import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { TaskHistory } from './entities/task-history.entity';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { TasksGateway } from './tasks.gateway';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------
const mockTask = {
  id: 1,
  title: 'Fix login bug',
  description: 'Users cannot login on mobile',
  status: TaskStatus.TODO,
  priority: TaskPriority.HIGH,
  dueDate: null,
  projectId: 1,
  project: null,
  creatorId: 2,
  creator: null,
  assigneeId: null,
  assignee: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as Task;

const mockProject = { id: 1, ownerId: 2 };

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------
const createMockTaskRepository = () => ({
  create: jest.fn((dto) => ({ ...mockTask, ...dto })),
  save: jest.fn((task) => Promise.resolve({ ...mockTask, ...task })),
  findOne: jest.fn(),
  update: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockTask], 1]),
  })),
});

const createMockTaskHistoryRepository = () => ({
  create: jest.fn((dto) => ({ id: 1, ...dto })),
  save: jest.fn().mockResolvedValue({}),
  find: jest.fn().mockResolvedValue([]),
});

const createMockProjectsService = () => ({
  findOne: jest.fn().mockResolvedValue(mockProject),
});

const createMockUsersService = () => ({
  findById: jest.fn(),
});

const createMockTasksGateway = () => ({
  notifyTaskCreated: jest.fn(),
  notifyTaskUpdated: jest.fn(),
  notifyTaskDeleted: jest.fn(),
});

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('TasksService', () => {
  let service: TasksService;
  let tasksRepository: ReturnType<typeof createMockTaskRepository>;
  let taskHistoryRepository: ReturnType<typeof createMockTaskHistoryRepository>;
  let projectsService: ReturnType<typeof createMockProjectsService>;
  let usersService: ReturnType<typeof createMockUsersService>;
  let tasksGateway: ReturnType<typeof createMockTasksGateway>;

  beforeEach(async () => {
    tasksRepository = createMockTaskRepository();
    taskHistoryRepository = createMockTaskHistoryRepository();
    projectsService = createMockProjectsService();
    usersService = createMockUsersService();
    tasksGateway = createMockTasksGateway();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: tasksRepository },
        { provide: getRepositoryToken(TaskHistory), useValue: taskHistoryRepository },
        { provide: ProjectsService, useValue: projectsService },
        { provide: UsersService, useValue: usersService },
        { provide: TasksGateway, useValue: tasksGateway },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─────────────────────────────────────────────────────────────────────────
  // findAll
  // ─────────────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should verify project access before returning tasks', async () => {
      await service.findAll(1, {}, 1, 'member');

      expect(projectsService.findOne).toHaveBeenCalledWith(1, 1, 'member');
      expect(tasksRepository.createQueryBuilder).toHaveBeenCalledWith('task');
    });

    it('should return paginated tasks with metadata', async () => {
      const result = await service.findAll(1, { page: 1, limit: 10 }, 1, 'admin');

      expect(result).toEqual({
        data: [mockTask],
        meta: { total: 1, page: 1, lastPage: 1 },
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // create
  // ─────────────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a task and notify via WebSocket', async () => {
      const dto = { title: 'New Task' };

      const result = await service.create(1, dto as any, 2, 'member');

      expect(projectsService.findOne).toHaveBeenCalledWith(1, 2, 'member');
      expect(tasksRepository.create).toHaveBeenCalledWith({ ...dto, projectId: 1, creatorId: 2 });
      expect(tasksRepository.save).toHaveBeenCalled();
      expect(tasksGateway.notifyTaskCreated).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if assignee does not exist', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.create(1, { title: 'Task', assigneeId: 999 } as any, 2, 'member'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // findOne
  // ─────────────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return the task if it exists in the project', async () => {
      tasksRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne(1, 1, 2, 'member');

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      tasksRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1, 2, 'member')).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // update
  // ─────────────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should save a TaskHistory record when status changes', async () => {
      tasksRepository.findOne.mockResolvedValue(mockTask); // findOne returns task with status: todo

      const dto = { status: TaskStatus.IN_PROGRESS };
      await service.update(1, 1, dto, 2, 'member');

      expect(taskHistoryRepository.create).toHaveBeenCalledWith({
        taskId: mockTask.id,
        oldStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
        changedById: 2,
      });
      expect(taskHistoryRepository.save).toHaveBeenCalled();
      expect(tasksGateway.notifyTaskUpdated).toHaveBeenCalled();
    });

    it('should NOT save TaskHistory if status does not change', async () => {
      tasksRepository.findOne.mockResolvedValue(mockTask); // status: todo

      const dto = { status: TaskStatus.TODO }; // same status
      await service.update(1, 1, dto, 2, 'member');

      expect(taskHistoryRepository.create).not.toHaveBeenCalled();
      expect(taskHistoryRepository.save).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // remove
  // ─────────────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should allow the task creator to delete the task', async () => {
      tasksRepository.findOne.mockResolvedValue({ ...mockTask, creatorId: 2 });

      const result = await service.remove(1, 1, 2, 'member'); // userId=2 is creator

      expect(tasksRepository.delete).toHaveBeenCalledWith(1);
      expect(tasksGateway.notifyTaskDeleted).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ success: true });
    });

    it('should allow an admin to delete any task', async () => {
      tasksRepository.findOne.mockResolvedValue({ ...mockTask, creatorId: 99 });

      const result = await service.remove(1, 1, 5, 'admin'); // userId=5 is not creator, but is admin

      expect(tasksRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });

    it('should throw ForbiddenException for a member who is not the creator or owner', async () => {
      tasksRepository.findOne.mockResolvedValue({ ...mockTask, creatorId: 99 });
      // mockProject.ownerId = 2, but current user is 5 (not owner, not creator)

      await expect(service.remove(1, 1, 5, 'member')).rejects.toThrow(ForbiddenException);
    });
  });
});
