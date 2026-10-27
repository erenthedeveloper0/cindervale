import { useState } from "react";
import { ProjectCard } from "./ProjectCard";

const STATUSES = ["draft", "active", "archived"];

export function ProjectList({ projects, onArchive, emptyLabel = "Nothing here yet" }) {
  const [status, setStatus] = useState("active");
  const visible = projects.filter((project) => project.status === status);

  return (
    <section className="project-list" aria-label="Projects">
      <nav role="tablist">
        {STATUSES.map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={value === status}
            onClick={() => setStatus(value)}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="empty">{emptyLabel}</p>
      ) : (
        <ul>
          {visible.map((project) => (
            <li key={project.id}>
              <ProjectCard {...project} onArchive={() => onArchive?.(project.id)} />
            </li>
          ))}
        </ul>
      )}
      {/* Totals stay visible while filtering. */}
      <footer>{visible.length} of {projects.length} projects</footer>
    </section>
  );
}
