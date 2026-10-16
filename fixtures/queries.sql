-- Billable hours per project for the last four weeks.
WITH weekly AS (
    SELECT
        p.id,
        p.name,
        date_trunc('week', t.logged_at) AS week,
        SUM(t.hours)::numeric(6, 1)      AS hours
    FROM studio.projects AS p
    JOIN studio.time_entries AS t ON t.project_id = p.id
    WHERE t.logged_at >= NOW() - INTERVAL '28 days'
      AND p.archived IS NOT TRUE
    GROUP BY p.id, p.name, week
)
SELECT
    name,
    week,
    hours,
    ROUND(hours / NULLIF(SUM(hours) OVER (PARTITION BY id), 0) * 100, 1) AS share_pct,
    CASE WHEN hours > 40 THEN 'over' ELSE 'ok' END AS status
FROM weekly
ORDER BY week DESC, hours DESC
LIMIT 50;

CREATE TABLE IF NOT EXISTS studio.invoices (
    id          BIGSERIAL PRIMARY KEY,
    project_id  INTEGER NOT NULL REFERENCES studio.projects (id),
    amount      DECIMAL(10, 2) DEFAULT 0.00,
    issued_on   DATE NOT NULL,
    paid        BOOLEAN DEFAULT FALSE,
    notes       TEXT NULL
);
