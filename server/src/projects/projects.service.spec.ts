import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { UsersService } from '../users/users.service';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockProjectRepository = {
    find: jest.fn(),
  };

  const mockProjectMemberRepository = {
    find: jest.fn(),
  };

  const mockUsersService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: mockProjectRepository },
        { provide: getRepositoryToken(ProjectMember), useValue: mockProjectMemberRepository },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllForUser', () => {
    it('should return all projects for an admin', async () => {
      const projects = [{ id: 1, name: 'Project 1' }];
      mockProjectRepository.find.mockResolvedValue(projects);

      const result = await service.findAllForUser(1, 'admin');
      
      expect(result).toEqual(projects);
      expect(mockProjectRepository.find).toHaveBeenCalled();
    });

    it('should return only member projects for a normal member', async () => {
      const memberships = [
        { id: 1, projectId: 1, userId: 2, project: { id: 1, name: 'Project 1' } },
      ];
      mockProjectMemberRepository.find.mockResolvedValue(memberships);

      const result = await service.findAllForUser(2, 'member');
      
      expect(result).toEqual([{ id: 1, name: 'Project 1' }]);
      expect(mockProjectMemberRepository.find).toHaveBeenCalledWith({
        where: { userId: 2 },
        relations: { project: true },
      });
    });
  });
});
