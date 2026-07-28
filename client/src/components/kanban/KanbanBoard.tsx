"use client";

import { useMemo, useState, useEffect } from "react";
import { Task, TaskStatus } from "@/types";
import { KanbanColumn } from "./KanbanColumn";
import { io, Socket } from "socket.io-client";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { tasksApi } from "@/lib/api/tasks";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface KanbanBoardProps {
  initialTasks: Task[];
  projectId: number;
}

export function KanbanBoard({ initialTasks, projectId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();

  // Sync tasks when initialTasks prop changes
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Optimistic update mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: Partial<Task> }) =>
      tasksApi.update(projectId, taskId, data),
    onSuccess: () => {
      // Invalidate to ensure consistency, but optimistic update is already applied
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  // Socket.io connection for real-time updates
  useEffect(() => {
    // Determine backend URL from NEXT_PUBLIC_API_URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';
    
    const socket: Socket = io(backendUrl, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("joinProject", projectId);
    });

    socket.on("task:updated", (updatedTask: Task) => {
      // Prevent optimistic update collision
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      queryClient.setQueryData(["tasks", projectId], (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((t: Task) => (t.id === updatedTask.id ? updatedTask : t)),
        };
      });
    });

    socket.on("task:created", (newTask: Task) => {
      setTasks((prevTasks) => {
        if (prevTasks.find(t => t.id === newTask.id)) return prevTasks;
        return [newTask, ...prevTasks];
      });
      queryClient.setQueryData(["tasks", projectId], (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: [newTask, ...oldData.data],
        };
      });
    });

    socket.on("task:deleted", ({ id }: { id: number }) => {
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== id));
      queryClient.setQueryData(["tasks", projectId], (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((t: Task) => t.id !== id),
        };
      });
    });

    return () => {
      socket.emit("leaveProject", projectId);
      socket.disconnect();
    };
  }, [projectId, queryClient]);

  const columns: { id: TaskStatus; title: string }[] = [
    { id: "todo", title: "To Do" },
    { id: "in_progress", title: "In Progress" },
    { id: "done", title: "Done" },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "Task") {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    // Moving over a task
    if (isOverTask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          const newTasks = [...tasks];
          newTasks[activeIndex].status = tasks[overIndex].status;
          return arrayMove(newTasks, activeIndex, overIndex);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Moving over an empty column
    if (isOverColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const newTasks = [...tasks];
        newTasks[activeIndex].status = overId as TaskStatus;
        return arrayMove(newTasks, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const task = tasks.find((t) => t.id === activeId);
    
    if (task) {
      // Fire mutation to update the backend
      updateTaskMutation.mutate({ taskId: activeId, data: { status: task.status } });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={getTasksByStatus(col.id)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
