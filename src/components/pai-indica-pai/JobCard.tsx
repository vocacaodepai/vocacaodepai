import { Link } from "@tanstack/react-router";
import { Building2, Clock, MapPin, Wifi } from "lucide-react";
import {
  daysUntil,
  formatSalaryRange,
  jobAreaLabel,
  jobTypeLabel,
} from "@/lib/pai-indica-pai/format";
import type { JobPublic } from "@/lib/pai-indica-pai/types";

export function JobCard({ job }: { job: JobPublic }) {
  const left = daysUntil(job.expires_at);
  return (
    <Link
      to="/pai-indica-pai/vagas/$slug"
      params={{ slug: job.slug }}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-bold leading-tight group-hover:text-primary">
          {job.title}
        </h3>
        <span className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
          {jobTypeLabel(job.type)}
        </span>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        {job.company}
      </p>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {job.remote ? (
          <>
            <Wifi className="h-4 w-4" />
            Remoto — Brasil
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4" />
            {job.city}/{job.uf}
          </>
        )}
      </p>
      <p className="line-clamp-2 text-sm">{job.summary}</p>
      <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="line-clamp-1">
          {job.area ? `${jobAreaLabel(job.area)} · ` : ""}
          {formatSalaryRange(job.salary_min, job.salary_max)}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <Clock className="h-3 w-3" />
          {left <= 0 ? "encerra hoje" : `${left} dias`}
        </span>
      </div>
    </Link>
  );
}
