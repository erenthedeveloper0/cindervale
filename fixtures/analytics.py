"""Weekly studio analytics: billable hours, budgets and project health."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Iterable

MAX_WEEKLY_HOURS = 40
CURRENCY = "EUR"


@dataclass(frozen=True)
class Project:
    name: str
    budget: float
    hours: list[float] = field(default_factory=list)
    archived: bool = False

    @property
    def burn_rate(self) -> float:
        """Share of the budget consumed, between 0 and 1."""
        if not self.budget:
            return 0.0
        return min(sum(self.hours) * 95 / self.budget, 1.0)


class BudgetError(ValueError):
    pass


def overdue(projects: Iterable[Project], *, threshold: float = 0.85) -> list[Project]:
    # Archived work never counts as overdue.
    return [p for p in projects if not p.archived and p.burn_rate >= threshold]


async def fetch_hours(client, project: Project, weeks: int = 4) -> dict[str, float]:
    since = date.today() - timedelta(weeks=weeks)
    try:
        response = await client.get(f"/projects/{project.name}/hours", params={"since": since.isoformat()})
        response.raise_for_status()
    except TimeoutError as exc:
        raise BudgetError(f"Timed out reading {project.name!r}") from exc
    return {row["week"]: row["hours"] for row in response.json() if row["hours"] > 0}


async def main(client) -> None:
    projects = [Project("Atelier", 24_000.0), Project("Field Notes", 8_500.0, archived=True)]
    results = await asyncio.gather(*(fetch_hours(client, p) for p in projects))
    for project, weekly in zip(projects, results):
        total = sum(weekly.values())
        print(f"{project.name:<12} {total:>6.1f}h  {project.burn_rate:.0%} of {CURRENCY}")
    if any(p.burn_rate > 1 for p in projects):
        raise BudgetError("Budget exceeded")
    return None
