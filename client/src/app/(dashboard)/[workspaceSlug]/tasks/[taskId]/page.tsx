import { ProjectBoard } from "@/features/projects/components/project-board";
import { TaskDetailDrawer } from "@/features/tasks/components/task-detail-drawer";
import { demoProjects, getTask } from "@/features/dashboard/api/demo-data";

export default async function TaskPage({ params }: { params: Promise<{ workspaceSlug: string; taskId: string }> }) {
  const { taskId } = await params;
  const task = getTask(taskId);
  const projectId = task?.projectId ?? demoProjects[0].id;
  return <><ProjectBoard key={projectId} projectId={projectId} /><TaskDetailDrawer key={taskId} taskId={taskId} /></>;
}
