import { Suspense } from "react";
import { InvitationAcceptPage } from "@/features/invitations/components/invitation-accept-page";

type InvitationPageProps = { params: Promise<{ token: string }> };

export default function InvitationPage({ params }: InvitationPageProps) {
  return (
    <Suspense fallback={<InvitationPageLoading />}>
      <InvitationPageContent params={params} />
    </Suspense>
  );
}

async function InvitationPageContent({ params }: InvitationPageProps) {
  const { token } = await params;
  return <InvitationAcceptPage token={token} />;
}

function InvitationPageLoading() {
  return (
    <main className="invite-page">
      <section className="invite-card" role="status" aria-label="Loading invitation">
        Loading invitation...
      </section>
    </main>
  );
}
