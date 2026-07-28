import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private projectMembersRepository: Repository<ProjectMember>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
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

  async findAllForUser(userId: string, role: string) {
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

  async findOne(id: string, userId: string, role: string) {
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

  async getMembers(projectId: string, userId: string, role: string) {
    // Verify access first
    await this.findOne(projectId, userId, role);

    const memberships = await this.projectMembersRepository.find({
      where: { projectId },
      relations: { user: true },
    });

    const memberMap = new Map<string, { id: string; name: string; email: string; role: string }>();

    for (const m of memberships) {
      memberMap.set(m.user.id, {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.user.role,
      });
    }

    // Always include all admin users in the list so they can be assigned to tasks
    const admins = await this.usersRepository.find({ where: { role: UserRole.ADMIN } });
    for (const admin of admins) {
      if (!memberMap.has(admin.id)) {
        memberMap.set(admin.id, {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        });
      }
    }

    return Array.from(memberMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async isMember(projectId: string, userId: string) {
    const membership = await this.projectMembersRepository.findOne({
      where: { projectId, userId },
    });

    return Boolean(membership);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string, role: string) {
    const project = await this.findOne(id, userId, role);
    
    // Only admins or project owners can update
    if (role !== 'admin' && project.ownerId !== userId) {
      throw new ForbiddenException('Only admins or the project owner can update this project');
    }

    await this.projectsRepository.update(id, updateProjectDto);
    return this.findOne(id, userId, 'admin'); // Bypass access check to just return updated entity
  }

  async remove(id: string, userId: string, role: string) {
    const project = await this.findOne(id, userId, role);
    
    // Only admins or project owners can delete
    if (role !== 'admin' && project.ownerId !== userId) {
      throw new ForbiddenException('Only admins or the project owner can delete this project');
    }

    await this.projectsRepository.delete(id);
    return { success: true };
  }

  async addMember(projectId: string, addMemberDto: AddMemberDto, currentUserId: string, role: string) {
    const project = await this.findOne(projectId, currentUserId, role);

    if (role !== 'admin' && project.ownerId !== currentUserId) {
      throw new ForbiddenException('Only admins or the project owner can add members');
    }

    // Look up user by email
    const userToAdd = await this.usersService.findByEmail(addMemberDto.email);
    if (!userToAdd) throw new NotFoundException('User with this email not found');

    const existingMembership = await this.projectMembersRepository.findOne({
      where: { projectId, userId: userToAdd.id },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this project');
    }

    await this.projectMembersRepository.save(
      this.projectMembersRepository.create({
        projectId,
        userId: userToAdd.id,
      })
    );

    return { id: userToAdd.id, name: userToAdd.name, email: userToAdd.email, role: userToAdd.role };
  }

  async removeMember(projectId: string, userIdToRemove: string, currentUserId: string, role: string) {
    const project = await this.findOne(projectId, currentUserId, role);

    if (role !== 'admin' && project.ownerId !== currentUserId) {
      throw new ForbiddenException('Only admins or the project owner can remove members');
    }

    if (project.ownerId === userIdToRemove) {
      throw new BadRequestException('Project owner cannot be removed from members');
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
