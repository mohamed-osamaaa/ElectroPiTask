"use client";

import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { projectsApi } from "@/lib/api/projects";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { CreateTaskDialog } from "@/components/kanban/CreateTaskDialog";
import { ManageMembersDialog } from "@/components/projects/ManageMembersDialog";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { TaskFilters } from "@/components/kanban/TaskFilters";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function ProjectKanbanPage() {
  const params = useParams();
  const projectId = params.id as string;
  const user = useAuthStore((state) => state.user);

  // All project members see all tasks by default (per requirements).
  // The assignee filter is optional — users can filter by any member including themselves.
  const [filters, setFilters] = useState<{
    status?: string;
    priority?: string;
    assigneeId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>({});

  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.getOne(projectId),
  });

  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ["tasks", projectId, filters],
    queryFn: () => tasksApi.getAll(projectId, { ...filters, limit: 100 }),
  });

  if (projectLoading || tasksLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
          <Skeleton className="h-full rounded-xl" />
          <Skeleton className="h-full rounded-xl" />
          <Skeleton className="h-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (projectError || tasksError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load project data. You may not have access to this project.
        </AlertDescription>
      </Alert>
    );
  }

  if (!project) {
    return <div>Project not found.</div>;
  }

  // Admin or project owner can manage members
  const canManageMembers = user?.role === "admin" || project.ownerId === user?.id;

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
            <ChevronLeft className="h-4 w-4" /> Back to Projects
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          {canManageMembers && (
            <ManageMembersDialog projectId={projectId} ownerId={project.ownerId} />
          )}
          <CreateTaskDialog projectId={projectId} />
        </div>
      </div>

      <TaskFilters
        projectId={projectId}
        filters={filters}
        onFilterChange={setFilters}
      />

      <KanbanBoard initialTasks={tasksData?.data || []} projectId={projectId} isProjectOwner={canManageMembers} />
    </div>
  );
}
