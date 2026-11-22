import { ProjectDetails } from "@/features/projects/components/project-details";

export default async function ProjectOverviewPage({ params }: { params: Promise<{ workspaceSlug: string; projectId: string }> }) {
  const { projectId } = await params;
  return <ProjectDetails projectId={projectId} />;
}
