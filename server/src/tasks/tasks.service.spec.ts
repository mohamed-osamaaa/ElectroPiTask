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
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Fix login bug',
  description: 'Users cannot login on mobile',
  status: TaskStatus.TODO,
  priority: TaskPriority.HIGH,
  dueDate: null,
  projectId: '00000000-0000-4000-8000-000000000010',
  project: null,
  creatorId: '00000000-0000-4000-8000-000000000002',
  creator: null,
  assigneeId: null,
  assignee: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as Task;

const projectId = '00000000-0000-4000-8000-000000000010';
const ownerId = '00000000-0000-4000-8000-000000000002';
const memberId = '00000000-0000-4000-8000-000000000003';
const outsiderId = '00000000-0000-4000-8000-000000000099';
const mockProject = { id: projectId, ownerId };

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
  isMember: jest.fn().mockResolvedValue(true),
});

const createMockUsersService = () => ({
  findById: jest.fn().mockResolvedValue({ id: memberId }),
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
      await service.findAll(projectId, {}, ownerId, 'member');

      expect(projectsService.findOne).toHaveBeenCalledWith(projectId, ownerId, 'member');
      expect(tasksRepository.createQueryBuilder).toHaveBeenCalledWith('task');
    });

    it('should return paginated tasks with metadata', async () => {
      const result = await service.findAll(projectId, { page: 1, limit: 10 }, ownerId, 'admin');

      expect(result).toEqual({
        data: [mockTask],
        meta: { total: 1, page: 1, lastPage: 1 },
      });
    });

    it('should apply search and sorting query options', async () => {
      await service.findAll(
        projectId,
        { search: 'login', sortBy: 'dueDate', sortOrder: 'asc' },
        ownerId,
        'member',
      );

      const queryBuilder = tasksRepository.createQueryBuilder.mock.results[0].value;

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: '%login%' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('task.dueDate', 'ASC');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // create
  // ─────────────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a task and notify via WebSocket', async () => {
      const dto = { title: 'New Task' };

      const result = await service.create(projectId, dto as any, ownerId, 'member');

      expect(projectsService.findOne).toHaveBeenCalledWith(projectId, ownerId, 'member');
      expect(tasksRepository.create).toHaveBeenCalledWith({ ...dto, projectId, creatorId: ownerId });
      expect(tasksRepository.save).toHaveBeenCalled();
      expect(tasksGateway.notifyTaskCreated).toHaveBeenCalledWith(projectId, expect.any(Object));
      expect(result).toBeDefined();
    });

    it('should create a task when the assignee is a project member', async () => {
      const dto = { title: 'New Task', assigneeId: memberId };

      await service.create(projectId, dto as any, ownerId, 'member');

      expect(usersService.findById).toHaveBeenCalledWith(memberId);
      expect(projectsService.isMember).toHaveBeenCalledWith(projectId, memberId);
      expect(tasksRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if assignee does not exist', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.create(projectId, { title: 'Task', assigneeId: outsiderId } as any, ownerId, 'member'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if assignee is not a project member', async () => {
      usersService.findById.mockResolvedValue({ id: outsiderId });
      projectsService.isMember.mockResolvedValue(false);

      await expect(
        service.create(projectId, { title: 'Task', assigneeId: outsiderId } as any, ownerId, 'member'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // findOne
  // ─────────────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return the task if it exists in the project', async () => {
      tasksRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne(mockTask.id, projectId, ownerId, 'member');

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      tasksRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(outsiderId, projectId, ownerId, 'member')).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // update
  // ─────────────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should save a TaskHistory record when status changes', async () => {
      tasksRepository.findOne.mockResolvedValue(mockTask); // findOne returns task with status: todo

      const dto = { status: TaskStatus.IN_PROGRESS };
      await service.update(mockTask.id, projectId, dto, ownerId, 'member');

      expect(taskHistoryRepository.create).toHaveBeenCalledWith({
        taskId: mockTask.id,
        projectId,
        oldStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
        changedById: ownerId,
      });
      expect(taskHistoryRepository.save).toHaveBeenCalled();
      expect(tasksGateway.notifyTaskUpdated).toHaveBeenCalled();
    });

    it('should NOT save TaskHistory if status does not change', async () => {
      tasksRepository.findOne.mockResolvedValue(mockTask); // status: todo

      const dto = { status: TaskStatus.TODO }; // same status
      await service.update(mockTask.id, projectId, dto, ownerId, 'member');

      expect(taskHistoryRepository.create).not.toHaveBeenCalled();
      expect(taskHistoryRepository.save).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // remove
  // ─────────────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should allow the task creator to delete the task', async () => {
      tasksRepository.findOne.mockResolvedValue({ ...mockTask, creatorId: ownerId });

      const result = await service.remove(mockTask.id, projectId, ownerId, 'member');

      expect(tasksRepository.delete).toHaveBeenCalledWith(mockTask.id);
      expect(tasksGateway.notifyTaskDeleted).toHaveBeenCalledWith(projectId, mockTask.id);
      expect(result).toEqual({ success: true });
    });

    it('should allow an admin to delete any task', async () => {
      tasksRepository.findOne.mockResolvedValue({ ...mockTask, creatorId: outsiderId });

      const result = await service.remove(mockTask.id, projectId, memberId, 'admin');

      expect(tasksRepository.delete).toHaveBeenCalledWith(mockTask.id);
      expect(result).toEqual({ success: true });
    });

    it('should throw ForbiddenException for a member who is not the creator or owner', async () => {
      tasksRepository.findOne.mockResolvedValue({ ...mockTask, creatorId: outsiderId });

      await expect(service.remove(mockTask.id, projectId, memberId, 'member')).rejects.toThrow(ForbiddenException);
    });
  });
});
