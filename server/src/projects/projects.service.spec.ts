import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { UsersService } from '../users/users.service';
import { BadRequestException } from '@nestjs/common';

const projectId = '00000000-0000-4000-8000-000000000010';
const ownerId = '00000000-0000-4000-8000-000000000001';
const memberId = '00000000-0000-4000-8000-000000000002';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockProjectRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockProjectMemberRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
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
      const projects = [{ id: projectId, name: 'Project 1' }];
      mockProjectRepository.find.mockResolvedValue(projects);

      const result = await service.findAllForUser(ownerId, 'admin');
      
      expect(result).toEqual(projects);
      expect(mockProjectRepository.find).toHaveBeenCalled();
    });

    it('should return only member projects for a normal member', async () => {
      const memberships = [
        { id: 'membership-id', projectId, userId: memberId, project: { id: projectId, name: 'Project 1' } },
      ];
      mockProjectMemberRepository.find.mockResolvedValue(memberships);

      const result = await service.findAllForUser(memberId, 'member');
      
      expect(result).toEqual([{ id: projectId, name: 'Project 1' }]);
      expect(mockProjectMemberRepository.find).toHaveBeenCalledWith({
        where: { userId: memberId },
        relations: { project: true },
      });
    });
  });

  describe('removeMember', () => {
    it('should reject removing the project owner from members', async () => {
      mockProjectRepository.findOne.mockResolvedValue({ id: projectId, ownerId });

      await expect(service.removeMember(projectId, ownerId, ownerId, 'admin')).rejects.toThrow(
        BadRequestException,
      );

      expect(mockProjectMemberRepository.delete).not.toHaveBeenCalled();
    });
  });
});
