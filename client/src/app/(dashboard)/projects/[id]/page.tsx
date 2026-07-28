"use client";

import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { projectsApi } from "@/lib/api/projects";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { CreateTaskDialog } from "@/components/kanban/CreateTaskDialog";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { TaskFilters } from "@/components/kanban/TaskFilters";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ChevronLeft } from "lucide-react";

export default function ProjectKanbanPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string, 10);

  const [filters, setFilters] = useState<{ status?: string; priority?: string; assigneeId?: number }>({});

  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.getOne(projectId),
  });

  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ["tasks", projectId, filters],
    queryFn: () => tasksApi.getAll(projectId, filters),
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
          Failed to load project data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!project) {
    return <div>Project not found.</div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
            <ChevronLeft className="h-4 w-4" /> Back to Projects
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Add member button could go here */}
          <CreateTaskDialog projectId={projectId} />
        </div>
      </div>


      <TaskFilters filters={filters} onFilterChange={setFilters} />

      <KanbanBoard initialTasks={tasksData?.data || []} projectId={projectId} />
    </div>
  );
}
