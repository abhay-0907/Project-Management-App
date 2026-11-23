import { ProjectBoard } from "@/features/projects/components/project-board";
import { TaskDetailDrawer } from "@/features/tasks/components/task-detail-drawer";

export default async function TaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string; taskId: string }>;
  searchParams: Promise<{ projectId?: string }>;
}) {
  const [{ taskId }, { projectId }] = await Promise.all([params, searchParams]);
  return <>{projectId && <ProjectBoard key={projectId} projectId={projectId} />}<TaskDetailDrawer key={`${projectId ?? "missing"}-${taskId}`} taskId={taskId} projectId={projectId} /></>;
}
