import { Icon } from "@/components/shared/icon";
import { Card } from "@/components/ui/card";

const showcaseItems = [
  {
    key: "workspace",
    eyebrow: "Your team, at a glance",
    title: "Workspace dashboard",
    description: "Start from a shared view of your workspace and the projects moving through it.",
  },
  {
    key: "projects",
    eyebrow: "Keep related work together",
    title: "Project management",
    description: "Organize projects in a clear list and keep key progress details close at hand.",
  },
  {
    key: "board",
    eyebrow: "See work move forward",
    title: "Kanban boards",
    description: "Group tasks by workflow stage and make it easier to see what needs attention.",
  },
  {
    key: "team",
    eyebrow: "Work better together",
    title: "Workspace collaboration",
    description: "Bring members into a shared workspace and understand how access is organized.",
  },
] as const;

export function ProductShowcase() {
  return (
    <section className="landing-section landing-showcase" aria-labelledby="showcase-heading">
      <div className="landing-container">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">A closer look</p>
          <h2 id="showcase-heading">Take a closer look at Nexora.</h2>
          <p className="landing-section-description">A focused view of the spaces, projects, and tasks your team works with.</p>
        </div>
        <div className="showcase-list">
          {showcaseItems.map((item) => (
            <Card className={`showcase-block landing-shadcn-card showcase-${item.key}`} role="article" key={item.key}>
              <ShowcasePreview variant={item.key} />
              <div className="showcase-copy">
                <p className="landing-eyebrow">{item.eyebrow}</p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </Card>
          ))}
        </div>
        <p className="showcase-disclaimer">Illustrative product previews · sample content, not live application data</p>
      </div>
    </section>
  );
}

function ShowcasePreview({ variant }: { variant: (typeof showcaseItems)[number]["key"] }) {
  if (variant === "workspace") {
    return (
      <Card className="showcase-preview landing-shadcn-card showcase-workspace-preview" role="img" aria-label="Illustrative workspace dashboard preview">
        <div className="showcase-preview-top"><span>Workspace overview</span><span className="preview-top-avatar">AM</span></div>
        <div className="showcase-welcome"><span>GOOD MORNING</span><b>Your workspace</b></div>
        <div className="showcase-metric-row"><div><small>Projects</small><b>06</b></div><div><small>Open tasks</small><b>24</b></div><div><small>Team members</small><b>08</b></div></div>
        <div className="showcase-preview-panel"><span className="showcase-panel-title">Active projects <small>View all <Icon name="arrow-right" size={11} /></small></span><div className="showcase-project-line"><i /><span>Website refresh</span><b>68%</b></div><div className="showcase-project-line"><i /><span>Product launch</span><b>42%</b></div></div>
      </Card>
    );
  }

  if (variant === "projects") {
    return (
      <Card className="showcase-preview landing-shadcn-card showcase-projects-preview" role="img" aria-label="Illustrative project list preview">
        <div className="showcase-preview-top"><span>Projects</span><span className="showcase-preview-button">+ New project</span></div>
        <div className="showcase-table-head"><span>PROJECT</span><span>STATUS</span><span>PROGRESS</span></div>
        {[["Website refresh", "In progress", "68%"], ["Product launch", "Planning", "42%"], ["Mobile app", "In progress", "81%"]].map(([name, status, progress]) => (
          <div className="showcase-table-row" key={name}><span className="showcase-project-name"><i /><b>{name}</b></span><span className="showcase-status">{status}</span><span className="showcase-table-progress"><i style={{ width: progress }} /></span></div>
        ))}
      </Card>
    );
  }

  if (variant === "board") {
    return (
      <Card className="showcase-preview landing-shadcn-card showcase-board-preview" role="img" aria-label="Illustrative Kanban board preview">
        <div className="showcase-preview-top"><span>Product launch</span><span className="showcase-board-menu"><Icon name="users" size={14} /> <i>AM</i><i>JL</i></span></div>
        <div className="showcase-board-columns">
          <BoardColumn title="To do" count="2" cards={["Draft launch plan", "Confirm owners"]} />
          <BoardColumn title="In progress" count="3" cards={["Prepare product notes", "Review onboarding flow"]} />
          <BoardColumn title="Done" count="2" cards={["Create project brief", "Align on milestones"]} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="showcase-preview landing-shadcn-card showcase-team-preview" role="img" aria-label="Illustrative workspace member roles preview">
      <div className="showcase-preview-top"><span>Workspace members</span><span className="showcase-preview-button">+ Invite</span></div>
      <div className="showcase-table-head"><span>MEMBER</span><span>ROLE</span><span>ACCESS</span></div>
      {[["Alex Morgan", "AM", "Owner"], ["Jamie Lee", "JL", "Admin"], ["Sam Taylor", "ST", "Member"]].map(([name, initials, role]) => (
        <div className="showcase-member-row" key={name}><span className="preview-avatar">{initials}</span><b>{name}</b><span className="showcase-role">{role}</span><Icon name="more" size={15} /></div>
      ))}
    </Card>
  );
}

function BoardColumn({ title, count, cards }: { title: string; count: string; cards: string[] }) {
  return (
    <div className="showcase-board-column">
      <div className="showcase-board-column-heading"><span>{title}</span><b>{count}</b></div>
      {cards.map((card, index) => <div className="showcase-board-card" key={card}><i className={index === 0 ? "is-blue" : ""} /><b>{card}</b><span><small>{index === 0 ? "NX-104" : "NX-108"}</small><em>AM</em></span></div>)}
      <span className="showcase-add-card">+ Add task</span>
    </div>
  );
}
