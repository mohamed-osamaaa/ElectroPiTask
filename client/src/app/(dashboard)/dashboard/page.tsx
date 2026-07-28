import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectList } from "@/components/projects/ProjectList";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <CreateProjectDialog />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Your Projects</h2>
        <ProjectList />
      </div>
    </div>
  );
}
