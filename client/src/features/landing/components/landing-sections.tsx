import Link from "next/link";
import { Icon, type IconName } from "@/components/shared/icon";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrentYear } from "./current-year";
import { LandingAccountLinks, LandingAction } from "./landing-action";

export function HeroSection() {
  return (
    <section className="landing-hero">
      <div className="landing-container landing-hero-grid">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">
            <span className="landing-eyebrow-dot" /> A clearer way to work
            together
          </p>
          <h1>
            Bring your team&apos;s work together.{" "}
            <em>Make progress visible.</em>
          </h1>
          <p className="landing-hero-description">
            Manage projects, organize tasks, and collaborate with your team —
            all from one organized workspace.
          </p>
          <div className="landing-hero-actions">
            <LandingAction />
            <LinkButton
              href="#features"
              variant="outline"
              size="lg"
              className="landing-button landing-button-secondary"
            >
              Explore Features <Icon name="arrow-right" size={16} />
            </LinkButton>
          </div>
          <p className="landing-hero-note">
            Workspaces <span>·</span> Projects <span>·</span> Tasks{" "}
            <span>·</span> Teams
          </p>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div
      className="hero-preview-wrap"
      role="img"
      aria-label="Illustrative Nexora workspace preview with sample content"
    >
      <Card className="hero-preview-card landing-shadcn-card">
        <div className="preview-window-bar">
          <div className="preview-window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span>nexora.app / workspace</span>
          <Icon name="more" size={17} />
        </div>
        <div className="preview-app">
          <aside className="preview-sidebar" aria-hidden="true">
            <div className="preview-sidebar-brand">
              <b>Nexora</b>
            </div>
            <small>WORKSPACE</small>
            <div className="preview-nav-item is-active">
              <Icon name="grid" size={14} /> Overview
            </div>
            <div className="preview-nav-item">
              <Icon name="folder" size={14} /> Projects
            </div>
            <div className="preview-nav-item">
              <Icon name="check-circle" size={14} /> My tasks
            </div>
            <div className="preview-nav-item">
              <Icon name="users" size={14} /> Members
            </div>
            <div className="preview-sidebar-user">
              <span className="preview-avatar">AM</span>
              <span>
                <b>Alex Morgan</b>
                <small>Workspace owner</small>
              </span>
            </div>
          </aside>
          <div className="preview-main">
            <div className="preview-topline">
              <span>Workspace / Overview</span>
              <span className="preview-top-avatar">AM</span>
            </div>
            <div className="preview-welcome">
              <div>
                <small>YOUR WORKSPACE</small>
                <h2>Good morning, Alex</h2>
                <p>Here&apos;s a look at what your team is working on.</p>
              </div>
              <span className="preview-date">This week⌄</span>
            </div>
            <div className="preview-stats">
              <div>
                <span>Active projects</span>
                <strong>06</strong>
                <small>Across your workspace</small>
              </div>
              <div>
                <span>Open tasks</span>
                <strong>24</strong>
                <small>8 assigned to you</small>
              </div>
              <div>
                <span>Team members</span>
                <strong>08</strong>
                <small>Working together</small>
              </div>
            </div>
            <div className="preview-work-card">
              <div className="preview-work-heading">
                <span>
                  <small>WORK IN MOTION</small>
                  <b>Project progress</b>
                </span>
                <span className="preview-text-link">
                  View projects <Icon name="arrow-right" size={12} />
                </span>
              </div>
              <div className="preview-project-row">
                <span className="preview-project-icon">
                  <Icon name="layers" size={13} />
                </span>
                <span className="preview-project-copy">
                  <b>Website refresh</b>
                  <small>5 tasks · updated today</small>
                </span>
                <span className="preview-progress">
                  <i style={{ width: "68%" }} />
                </span>
                <strong>68%</strong>
              </div>
              <div className="preview-project-row">
                <span className="preview-project-icon">
                  <Icon name="board" size={13} />
                </span>
                <span className="preview-project-copy">
                  <b>Product launch</b>
                  <small>8 tasks · updated yesterday</small>
                </span>
                <span className="preview-progress">
                  <i style={{ width: "42%" }} />
                </span>
                <strong>42%</strong>
              </div>
            </div>
            <div className="preview-board-label">
              <span>UP NEXT</span>
              <span>
                Board view <Icon name="arrow-up-right" size={12} />
              </span>
            </div>
            <div className="preview-task-strip">
              <span className="preview-task-check">
                <Icon name="check" size={11} />
              </span>
              <span>Review the launch checklist</span>
              <span className="preview-task-owner">AM</span>
            </div>
          </div>
        </div>
      </Card>
      <p className="preview-disclaimer">
        Illustrative product preview · sample content
      </p>
    </div>
  );
}

const solutions: Array<{
  icon: IconName;
  title: string;
  problem: string;
  solution: string;
}> = [
  {
    icon: "list",
    title: "Scattered tasks",
    problem: "Work gets difficult to track across projects.",
    solution: "Bring tasks into one organized place.",
  },
  {
    icon: "chart",
    title: "Unclear progress",
    problem: "It can be hard to see what is moving forward.",
    solution: "Use project views and Kanban boards to see status.",
  },
  {
    icon: "users",
    title: "Team coordination",
    problem: "People need a shared space to work together.",
    solution: "Bring your team into collaborative workspaces.",
  },
  {
    icon: "shield",
    title: "Unclear ownership",
    problem: "Responsibilities can get lost between handoffs.",
    solution: "Assign tasks and manage access by role.",
  },
];

export function ProblemSolutionSection() {
  return (
    <section className="landing-section landing-solutions">
      <div className="landing-container">
        <SectionHeading
          eyebrow="A more connected way to work"
          title="Everything your team needs, organized in one place."
          description="Managing projects across disconnected tools can make collaboration difficult. Nexora brings projects, tasks, and team workflows into one organized environment."
        />
        <div className="solution-grid">
          {solutions.map((item) => (
            <Card
              className="solution-card landing-shadcn-card"
              role="article"
              key={item.title}
            >
              <span className="landing-icon-tile">
                <Icon name={item.icon} size={20} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.problem}</p>
              <div className="solution-answer">
                <Icon name="arrow-right" size={14} />
                <span>{item.solution}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const features: Array<{ icon: IconName; title: string; description: string }> =
  [
    {
      icon: "layers",
      title: "Workspace Management",
      description:
        "Organize teams and projects in dedicated workspaces. Manage members and their access.",
    },
    {
      icon: "folder",
      title: "Project Management",
      description:
        "Create and organize projects to keep related work structured and easy to find.",
    },
    {
      icon: "board",
      title: "Kanban Boards",
      description:
        "Visualize task progress and organize work into clear workflow stages.",
    },
    {
      icon: "check-circle",
      title: "Task Management",
      description:
        "Create, assign, prioritize, and track tasks as work moves forward.",
    },
    {
      icon: "users",
      title: "Team Collaboration",
      description:
        "Bring team members together in one shared environment for their work.",
    },
    {
      icon: "shield",
      title: "Role-Based Access",
      description: "Manage workspace permissions through clear member roles.",
    },
  ];

export function FeaturesSection() {
  return (
    <section className="landing-section landing-features" id="features">
      <div className="landing-container">
        <SectionHeading
          eyebrow="Made for the work you do every day"
          title="Everything you need to manage work better."
          description="A shared place for the projects, tasks, and people that keep your work moving."
        />
        <div className="feature-grid">
          {features.map((feature) => (
            <Card
              className="feature-card landing-shadcn-card"
              role="article"
              key={feature.title}
            >
              <span className="landing-icon-tile">
                <Icon name={feature.icon} size={20} />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const steps = [
    {
      title: "Create your workspace",
      description: "Set up a dedicated workspace for your team.",
    },
    {
      title: "Organize your projects",
      description: "Create projects and structure your team’s work.",
    },
    {
      title: "Manage and collaborate",
      description:
        "Assign tasks, track progress, and collaborate with your team.",
    },
  ];

  return (
    <section className="landing-section landing-how" id="how-it-works">
      <div className="landing-container">
        <SectionHeading
          eyebrow="A simple place to start"
          title="Get your team organized in three simple steps."
        />
        <div className="steps-grid">
          {steps.map((step, index) => (
            <Card
              className="step-card landing-shadcn-card"
              role="article"
              key={step.title}
            >
              <span className="step-number">0{index + 1}</span>
              {index < steps.length - 1 && (
                <span className="step-connector" aria-hidden="true" />
              )}
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section className="landing-section landing-about" id="about">
      <div className="landing-container about-inner">
        <div>
          <p className="landing-eyebrow">About Nexora</p>
          <h2>Built to make teamwork more organized.</h2>
          <p>
            Nexora is designed to simplify project management by bringing
            workspaces, projects, tasks, and team collaboration into a single
            platform.
          </p>
        </div>
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section className="landing-section landing-final-cta">
      <Card className="landing-container landing-cta-panel landing-shadcn-card">
        <div>
          <p className="landing-eyebrow">A clearer workspace starts here</p>
          <h2>Ready to bring your projects under control?</h2>
          <p>Start organizing your team&apos;s work with Nexora.</p>
        </div>
        <LandingAction variant="secondary" />
      </Card>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="landing-footer-main">
          <div className="landing-footer-brand">
            <Link className="landing-brand" href="/">
              <span>Nexora</span>
            </Link>
            <p>A shared space for projects, tasks, and team collaboration.</p>
          </div>
          <div className="landing-footer-links">
            <div>
              <h3>Product</h3>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
            </div>
            <div>
              <h3>Company</h3>
              <a href="#about">About</a>
            </div>
            <div>
              <h3>Account</h3>
              <LandingAccountLinks />
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>
            © <CurrentYear /> Nexora. All rights reserved.
          </span>
          <a href="#top" className="back-to-top">
            Back to top <Icon name="arrow-up-right" size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="landing-section-heading">
      <p className="landing-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && (
        <p className="landing-section-description">{description}</p>
      )}
    </div>
  );
}
