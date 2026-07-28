import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task inside a project' })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.create(projectId, createTaskDto, user.id, user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get tasks with filtering and pagination' })
  findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() filterDto: FilterTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.findAll(projectId, filterDto, user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.findOne(id, projectId, user.id, user.role);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get audit log of task status changes' })
  getHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.getHistory(id, projectId, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.update(id, projectId, updateTaskDto, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.remove(id, projectId, user.id, user.role);
  }
}
