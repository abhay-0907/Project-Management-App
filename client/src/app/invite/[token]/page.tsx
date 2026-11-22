import Link from "next/link";
import { Icon } from "@/components/shared/icon";
import { demoWorkspace } from "@/features/dashboard/api/demo-data";

export default async function InvitationAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <main className="invite-page"><section className="invite-card"><Link href={`/${demoWorkspace.slug}`} className="brand-mark"><span className="brand-symbol">n</span><span>Nexora</span></Link><span className="invite-illustration"><Icon name="users" size={25} /></span><span className="eyebrow">WORKSPACE INVITATION</span><h1>You’ve been invited to join {demoWorkspace.name}</h1><p>Collaborate on projects, share updates, and keep the team moving forward.</p><div className="invite-workspace"><span className="workspace-monogram">A</span><span><strong>{demoWorkspace.name}</strong><small>Product workspace · {token ? "Invitation link" : "Invite"}</small></span></div><Link href={`/${demoWorkspace.slug}`} className="button button-primary invite-accept-button">Accept invitation <Icon name="arrow-right" size={16} /></Link><small className="invite-footnote">By joining, you agree to follow your workspace access policies.</small></section></main>;
}
