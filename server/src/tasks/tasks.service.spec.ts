import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { TaskHistory } from './entities/task-history.entity';
import { TasksGateway } from './tasks.gateway';

describe('TasksService', () => {
  let service: TasksService;
  let projectsService: ProjectsService;

  const mockTaskRepository = {
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  const mockProjectsService = {
    findOne: jest.fn(),
  };

  const mockUsersService = {};

  const mockTaskHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockTasksGateway = {
    notifyTaskUpdated: jest.fn(),
    notifyTaskCreated: jest.fn(),
    notifyTaskDeleted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockTaskRepository },
        { provide: getRepositoryToken(TaskHistory), useValue: mockTaskHistoryRepository },
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: TasksGateway, useValue: mockTasksGateway },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    projectsService = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should verify project access before returning tasks', async () => {
      mockProjectsService.findOne.mockResolvedValue({ id: 1 });

      await service.findAll(1, {}, 1, 'member');

      expect(mockProjectsService.findOne).toHaveBeenCalledWith(1, 1, 'member');
      expect(mockTaskRepository.createQueryBuilder).toHaveBeenCalledWith('task');
    });
  });
});
