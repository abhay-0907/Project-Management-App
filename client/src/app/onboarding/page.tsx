import Link from "next/link";
import { Icon } from "@/components/shared/icon";

export default function OnboardingPage() {
  return <main className="onboarding-page"><div className="onboarding-brand"><Link className="brand-mark" href="/workspaces">Nexora</Link></div><section className="onboarding-card"><span className="onboarding-kicker"><Icon name="spark" size={15} /> YOUR TEAM SPACE</span><h1>Good work starts<br />with a shared space.</h1><p>Bring projects, conversations, and the next small step together in one calm workspace.</p><Link href="/workspaces" className="button button-primary">Choose a workspace <Icon name="arrow-right" size={16} /></Link><Link href="/onboarding/create-workspace" className="onboarding-secondary-link">Or create a new workspace</Link></section><div className="onboarding-decoration onboarding-decoration-one" /><div className="onboarding-decoration onboarding-decoration-two" /></main>;
}
