import { ProjectsOverview } from "@/features/projects/components/projects-overview";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const query = await searchParams;
  return <ProjectsOverview initialStatus={query.status ?? "ALL"} />;
}
