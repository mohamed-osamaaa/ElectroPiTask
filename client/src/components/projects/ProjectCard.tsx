"use client";

import { Project } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CalendarDays, FolderGit2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit2, MoreVertical, Trash2 } from "lucide-react";
import { EditProjectDialog } from "./EditProjectDialog";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { toast } from "sonner";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.remove(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete project");
    }
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to project
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project? All associated tasks will be lost.")) {
      deleteMutation.mutate();
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditOpen(true);
  };

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={`/projects/${project.id}`}>
        <Card className="h-full flex flex-col cursor-pointer transition-colors hover:border-primary/50 group bg-gradient-to-br from-card to-card/50 relative">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                <FolderGit2 className="h-5 w-5" />
                {project.name}
              </CardTitle>
              <div onClick={(e) => e.preventDefault()}>
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEditClick}>
                      <Edit2 className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardDescription className="line-clamp-2 min-h-[40px]">
              {project.description || "No description provided."}
            </CardDescription>
          </CardHeader>
          <div className="flex-grow"></div>
          <CardFooter className="text-sm text-muted-foreground pt-4 border-t border-border/50">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <span>{format(new Date(project.createdAt), "MMM d, yyyy")}</span>
            </div>
          </CardFooter>
        </Card>
      </Link>
      {editOpen && (
        <EditProjectDialog project={project} open={editOpen} onOpenChange={setEditOpen} />
      )}
    </motion.div>
  );
}
