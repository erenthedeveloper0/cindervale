"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { fetchProjects, type Project } from "@/lib/api";

type Status = "draft" | "active" | "archived";

interface ProjectBoardProps {
  title: string;
  initialFilter?: Status;
  emptyState?: ReactNode;
  onSelect?: (project: Project) => void;
}

const PAGE_SIZE = 12;
const STATUS_LABELS: Record<Status, string> = {
  draft: "Draft",
  active: "In progress",
  archived: "Archived",
};

/**
 * A responsive board of studio projects, filtered by status.
 * @param title - Heading shown above the grid.
 */
export default function ProjectBoard({
  title,
  initialFilter = "active",
  emptyState = null,
  onSelect,
}: ProjectBoardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<Status>(initialFilter);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const data = await fetchProjects({ limit: PAGE_SIZE, signal: controller.signal });
        setProjects(data.filter((project) => project.budget > 0));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  // Only the current status, capped to one page.
  const visible = useMemo(
    () => projects.filter((project) => project.status === filter).slice(0, PAGE_SIZE),
    [projects, filter],
  );

  const handleSelect = useCallback((project: Project) => onSelect?.(project), [onSelect]);

  if (error) {
    return <p className="text-sm text-red-700">Something went wrong: {error.message}</p>;
  }

  return (
    <section className={cn("grid gap-6 p-8", isLoading && "opacity-60")} aria-busy={isLoading}>
      <header className="flex items-baseline justify-between">
        <h2 className="font-serif text-3xl tracking-tight">{title}</h2>
        <span className="text-xs uppercase text-stone-500">{visible.length} projects</span>
      </header>

      <nav className="flex gap-2">
        {(Object.keys(STATUS_LABELS) as Status[]).map((status) => (
          <button key={status} type="button" data-active={status === filter} onClick={() => setFilter(status)}>
            {STATUS_LABELS[status]}
          </button>
        ))}
      </nav>

      {visible.length === 0 ? (
        emptyState
      ) : (
        <ul className="grid grid-cols-3 gap-4">
          {visible.map((project) => (
            <li key={project.id}>
              <Link href={`/projects/${project.slug}`} onClick={() => handleSelect(project)}>
                {project.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
