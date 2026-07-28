"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { History, ArrowRight } from "lucide-react";

interface TaskEditDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskEditDialog({ task, open, onOpenChange }: TaskEditDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState<string>(task.dueDate ? task.dueDate.substring(0, 10) : "");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.substring(0, 10) : "");
    }
  }, [task, open]);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["taskHistory", task.id],
    queryFn: () => tasksApi.getHistory(task.projectId, task.id),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Task>) => tasksApi.update(task.projectId, task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", task.projectId] });
      toast.success("Task updated successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update task");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    mutation.mutate({ 
      title, 
      description, 
      status, 
      priority,
      dueDate: dueDate || undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" /> History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Task description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(val: any) => setStatus(val as TaskStatus || "todo")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(val: any) => setPriority(val as TaskPriority || "medium")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending || !title.trim() || (title === task.title && description === task.description && status === task.status && priority === task.priority && dueDate === (task.dueDate ? task.dueDate.substring(0, 10) : ""))}>
                  {mutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="history">
            <div className="py-4 max-h-[300px] overflow-y-auto pr-2 space-y-4">
              {historyLoading ? (
                <div className="text-center text-sm text-muted-foreground py-4">Loading history...</div>
              ) : !historyData || historyData.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">No history available for this task.</div>
              ) : (
                historyData.map((record: any) => (
                  <div key={record.id} className="flex items-start gap-3 text-sm bg-muted/30 p-3 rounded-lg border">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{record.changedBy?.email}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(record.changedAt), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-muted px-2 py-1 rounded text-xs capitalize">{record.oldStatus.replace('_', ' ')}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs capitalize font-medium">{record.newStatus.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
