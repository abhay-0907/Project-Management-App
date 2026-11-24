import { InvitationAcceptPage } from "@/features/invitations/components/invitation-accept-page";

type InvitationPageProps = { params: Promise<{ token: string }> };

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  return <InvitationAcceptPage token={token} />;
}
