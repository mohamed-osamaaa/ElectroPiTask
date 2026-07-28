"use client";

import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { ProjectCard } from "./ProjectCard";
import { motion } from "framer-motion";

export function ProjectList() {
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-muted/50 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Failed to load projects.</div>;
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl text-center">
        <p className="text-muted-foreground">You don't have any projects yet.</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {projects.map((project: any) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </motion.div>
  );
}
