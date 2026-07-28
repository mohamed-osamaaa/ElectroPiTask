import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private projectMembersRepository: Repository<ProjectMember>,
    private usersService: UsersService,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: number) {
    const project = this.projectsRepository.create({
      ...createProjectDto,
      ownerId: userId,
    });
    
    const savedProject = await this.projectsRepository.save(project);
    
    // Automatically add owner as a member
    await this.projectMembersRepository.save(
      this.projectMembersRepository.create({
        projectId: savedProject.id,
        userId: userId,
      })
    );

    return savedProject;
  }

  async findAllForUser(userId: number, role: string) {
    if (role === 'admin') {
      return this.projectsRepository.find();
    }
    
    // For members, only return projects they are part of
    const memberships = await this.projectMembersRepository.find({
      where: { userId },
      relations: { project: true },
    });
    
    return memberships.map((m) => m.project);
  }

  async findOne(id: number, userId: number, role: string) {
    const project = await this.projectsRepository.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    if (role !== 'admin') {
      const isMember = await this.projectMembersRepository.findOne({
        where: { projectId: id, userId },
      });
      if (!isMember) throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto, userId: number, role: string) {
    const project = await this.findOne(id, userId, role);
    
    // Only admins or project owners can update
    if (role !== 'admin' && project.ownerId !== userId) {
      throw new ForbiddenException('Only admins or the project owner can update this project');
    }

    await this.projectsRepository.update(id, updateProjectDto);
    return this.findOne(id, userId, 'admin'); // Bypass access check to just return updated entity
  }

  async remove(id: number, userId: number, role: string) {
    const project = await this.findOne(id, userId, role);
    
    // Only admins or project owners can delete
    if (role !== 'admin' && project.ownerId !== userId) {
      throw new ForbiddenException('Only admins or the project owner can delete this project');
    }

    await this.projectsRepository.delete(id);
    return { success: true };
  }

  async addMember(projectId: number, addMemberDto: AddMemberDto, currentUserId: number, role: string) {
    const project = await this.findOne(projectId, currentUserId, role);

    if (role !== 'admin' && project.ownerId !== currentUserId) {
      throw new ForbiddenException('Only admins or the project owner can add members');
    }

    const userToAdd = await this.usersService.findById(addMemberDto.userId);
    if (!userToAdd) throw new NotFoundException('User not found');

    const existingMembership = await this.projectMembersRepository.findOne({
      where: { projectId, userId: addMemberDto.userId },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this project');
    }

    return this.projectMembersRepository.save(
      this.projectMembersRepository.create({
        projectId,
        userId: addMemberDto.userId,
      })
    );
  }

  async removeMember(projectId: number, userIdToRemove: number, currentUserId: number, role: string) {
    const project = await this.findOne(projectId, currentUserId, role);

    if (role !== 'admin' && project.ownerId !== currentUserId) {
      throw new ForbiddenException('Only admins or the project owner can remove members');
    }

    const membership = await this.projectMembersRepository.findOne({
      where: { projectId, userId: userIdToRemove },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this project');
    }

    await this.projectMembersRepository.delete(membership.id);
    return { success: true };
  }
}
