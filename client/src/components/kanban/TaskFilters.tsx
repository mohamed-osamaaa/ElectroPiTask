"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterX } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";

interface TaskFiltersProps {
  projectId: string;
  filters: { status?: string; priority?: string; assigneeId?: string };
  onFilterChange: (filters: any) => void;
}

export function TaskFilters({ projectId, filters, onFilterChange }: TaskFiltersProps) {
  const hasFilters = filters.status || filters.priority || filters.assigneeId;

  const { data: members = [] } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => projectsApi.getMembers(projectId),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-2 rounded-lg border">
      <div className="w-full md:w-auto text-sm font-medium text-muted-foreground ml-2 mb-1 md:mb-0">Filters:</div>

      {/* Status Filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground font-medium">Status:</span>
        <Select
          value={filters.status || "all"}
          onValueChange={(val) => onFilterChange({ ...filters, status: val === "all" ? undefined : val })}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground font-medium">Priority:</span>
        <Select
          value={filters.priority || "all"}
          onValueChange={(val) => onFilterChange({ ...filters, priority: val === "all" ? undefined : val })}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignee Filter — only project members */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground font-medium">Assignee:</span>
        <Select
          value={filters.assigneeId ? String(filters.assigneeId) : "all"}
          onValueChange={(val) =>
            onFilterChange({ ...filters, assigneeId: val === "all" ? undefined : val })
          }
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <span className="truncate">
              {!filters.assigneeId
                ? "All Assignees"
                : (members as any[]).find((m) => String(m.id) === String(filters.assigneeId))?.name ?? "All Assignees"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {(members as any[]).map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={() => onFilterChange({})}
        >
          <FilterX className="h-3 w-3 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}
