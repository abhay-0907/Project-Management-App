import { ProjectBoard } from "@/features/projects/components/project-board";

export default async function ProjectBoardPage({ params }: { params: Promise<{ workspaceSlug: string; projectId: string }> }) {
  const { projectId } = await params;
  return <ProjectBoard key={projectId} projectId={projectId} />;
}
