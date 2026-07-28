"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterX, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";

interface TaskFiltersProps {
  projectId: string;
  filters: {
    status?: string;
    priority?: string;
    assigneeId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
  onFilterChange: (filters: any) => void;
}

export function TaskFilters({ projectId, filters, onFilterChange }: TaskFiltersProps) {
  const hasFilters =
    filters.status ||
    filters.priority ||
    filters.assigneeId ||
    filters.search ||
    filters.sortBy ||
    filters.sortOrder;

  const { data: members = [] } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => projectsApi.getMembers(projectId),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-2 rounded-lg border">
      <div className="w-full md:w-auto text-sm font-medium text-muted-foreground ml-2 mb-1 md:mb-0">Filters:</div>

      <div className="relative w-full md:w-[220px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search || ""}
          onChange={(event) =>
            onFilterChange({ ...filters, search: event.target.value.trim() ? event.target.value : undefined })
          }
          placeholder="Search tasks..."
          className="h-8 pl-8 text-xs"
        />
      </div>

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
        <SearchableSelect
          value={filters.assigneeId ? String(filters.assigneeId) : "all"}
          onValueChange={(val) =>
            onFilterChange({ ...filters, assigneeId: val === "all" ? undefined : val })
          }
          placeholder="All Assignees"
          searchPlaceholder="Search members..."
          className="w-[160px]"
          options={[
            { value: "all", label: "All Assignees" },
            ...(members as any[]).map((m) => ({
              value: String(m.id),
              label: m.name,
              sublabel: m.email,
            }))
          ]}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground font-medium">Sort:</span>
        <Select
          value={filters.sortBy || "createdAt"}
          onValueChange={(val) => onFilterChange({ ...filters, sortBy: val })}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created</SelectItem>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5">
        <Select
          value={filters.sortOrder || "desc"}
          onValueChange={(val) => onFilterChange({ ...filters, sortOrder: val })}
        >
          <SelectTrigger className="w-[96px] h-8 text-xs">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Desc</SelectItem>
            <SelectItem value="asc">Asc</SelectItem>
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
