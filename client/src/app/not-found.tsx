import Link from "next/link";
import { Icon } from "@/components/shared/icon";
import { demoWorkspace } from "@/features/dashboard/api/demo-data";

export default function NotFound() {
  return <main className="not-found-page"><span className="not-found-mark"><Icon name="search" size={25} /></span><span className="eyebrow">404 · NOT HERE</span><h1>Looks like this page moved.</h1><p>The link may be out of date, or this page may not exist in your workspace.</p><Link href={`/${demoWorkspace.slug}`} className="button button-primary">Back to overview <Icon name="arrow-right" size={15} /></Link></main>;
}
