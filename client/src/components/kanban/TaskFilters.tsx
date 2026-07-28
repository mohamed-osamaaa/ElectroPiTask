"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterX } from "lucide-react";

import { Input } from "@/components/ui/input";

interface TaskFiltersProps {
  filters: { status?: string; priority?: string; assigneeId?: number };
  onFilterChange: (filters: any) => void;
}

export function TaskFilters({ filters, onFilterChange }: TaskFiltersProps) {
  const hasFilters = filters.status || filters.priority || filters.assigneeId;

  return (
    <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg border">
      <div className="text-sm font-medium text-muted-foreground ml-2">Filters:</div>
      
      <Select 
        value={filters.status || "all"} 
        onValueChange={(val) => onFilterChange({ ...filters, status: val === "all" ? undefined : val })}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="todo">To Do</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="done">Done</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.priority || "all"} 
        onValueChange={(val) => onFilterChange({ ...filters, priority: val === "all" ? undefined : val })}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="number"
        placeholder="Assignee ID"
        className="w-[110px] h-8 text-xs"
        value={filters.assigneeId || ""}
        onChange={(e) => {
          const val = e.target.value;
          onFilterChange({ ...filters, assigneeId: val ? parseInt(val, 10) : undefined });
        }}
      />

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
