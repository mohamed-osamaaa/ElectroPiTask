"use client";

import { Task, TaskStatus } from "@/types";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  isProjectOwner: boolean;
}

export function KanbanColumn({ id, title, tasks, isProjectOwner }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: "Column",
    },
  });

  return (
    <div className="flex flex-col h-full bg-muted/40 rounded-xl border border-border/50">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full font-medium">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 p-2 flex flex-col gap-2 min-h-[150px] overflow-y-auto"
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-border/50 rounded-xl min-h-[100px]">
              <span className="text-xs text-muted-foreground">No tasks</span>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} isProjectOwner={isProjectOwner} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
