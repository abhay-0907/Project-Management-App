import { ProjectSettings } from "@/features/projects/components/project-settings";

export default async function ProjectSettingsPage({ params }: { params: Promise<{ workspaceSlug: string; projectId: string }> }) {
  const { projectId } = await params;
  return <ProjectSettings projectId={projectId} />;
}
