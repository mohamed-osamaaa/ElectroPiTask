"use client";

import { Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TaskEditDialog } from "./TaskEditDialog";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { usersApi } from "@/lib/api/users";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch users to resolve assignee name
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const assignee = task.assigneeId
    ? (users as any[]).find((u) => u.id === task.assigneeId)
    : null;

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.remove(task.projectId, task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", task.projectId] });
      toast.success("Task deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete task");
    }
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this task?")) {
      deleteMutation.mutate();
    }
  };

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "Task", task },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const priorityColors = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-50 ring-2 ring-primary rounded-xl">
        <Card className="cursor-grab p-4 h-full bg-muted border-dashed border-2">
          <div className="invisible">
            <CardTitle>{task.title}</CardTitle>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="group cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all shadow-sm hover:shadow-md relative"
    >
      <div {...attributes} {...listeners} className="absolute inset-0 z-0" />
      <CardHeader className="p-4 pb-2 relative z-10 flex flex-row justify-between items-start gap-2">
        <CardTitle className="text-sm font-medium leading-snug break-words flex-1">
          {task.title}
        </CardTitle>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColors[task.priority]}`}>
            {task.priority}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            } />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}>
                <Edit2 className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 text-xs text-muted-foreground relative z-10">
        {task.description && (
          <p className="line-clamp-2 mb-3 mt-1 text-[11px] leading-relaxed">{task.description}</p>
        )}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-[10px]">
            {task.dueDate && (
              <>
                <Clock className="w-3 h-3" />
                {format(new Date(String(task.dueDate).substring(0, 10) + "T00:00:00"), "MMM d")}
              </>
            )}
          </div>
          {assignee ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">{assignee.name}</span>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
                  {assignee.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">?</AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>

      {editOpen && (
        <TaskEditDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
      )}
    </Card>
  );
}
