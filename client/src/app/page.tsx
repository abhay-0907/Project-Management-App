import type { Metadata } from "next";
import { LandingAuthProvider } from "@/features/landing/components/landing-auth";
import { LandingNavbar } from "@/features/landing/components/landing-navbar";
import {
  AboutSection,
  FeaturesSection,
  FinalCtaSection,
  HeroSection,
  HowItWorksSection,
  LandingFooter,
  ProblemSolutionSection,
} from "@/features/landing/components/landing-sections";
import { ProductShowcase } from "@/features/landing/components/product-showcase";

export const metadata: Metadata = {
  title: "Nexora — Project Management and Team Collaboration",
  description:
    "Manage projects, organize tasks, and collaborate with your team in one organized workspace with Nexora.",
  openGraph: {
    title: "Nexora — Project Management and Team Collaboration",
    description:
      "Manage projects, organize tasks, and collaborate with your team in one organized workspace with Nexora.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <LandingAuthProvider>
      <div className="landing-page" id="top">
        <LandingNavbar />
        <main>
          <HeroSection />
          <ProblemSolutionSection />
          <FeaturesSection />
          <ProductShowcase />
          <HowItWorksSection />
          <AboutSection />
          <FinalCtaSection />
        </main>
        <LandingFooter />
      </div>
    </LandingAuthProvider>
  );
}
