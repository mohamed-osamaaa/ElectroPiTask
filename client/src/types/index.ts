export type UserRole = 'admin' | 'member';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  projectId: number;
  creatorId: number;
  assigneeId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTasks {
  data: Task[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}
