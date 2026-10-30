import { useEffect } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { JobDetail } from "@/components/pai-indica-pai/JobDetail";
import { PipNav } from "@/components/pai-indica-pai/shared";
import { trackJobView } from "@/lib/pai-indica-pai/client";

const routeApi = getRouteApi("/_site/pai-indica-pai/vagas/$slug");

/** Página da vaga (doc 08 §3.3). Views contam 1x por sessão; JSON-LD vem do head() da rota. */
export default function JobPage() {
  const data = routeApi.useLoaderData();
  const job = data?.job;

  useEffect(() => {
    if (job && data?.live) void trackJobView(job);
  }, [job, data?.live]);

  if (!data || !job) return null;

  return (
    <div className="container max-w-4xl space-y-6 pb-16 pt-6">
      <Breadcrumbs
        items={[
          { name: "Pai Indica Pai", path: "/pai-indica-pai" },
          { name: "Vagas", path: "/pai-indica-pai/vagas" },
          { name: job.title, path: `/pai-indica-pai/vagas/${job.slug}` },
        ]}
      />
      <PipNav current="/pai-indica-pai/vagas" />
      <JobDetail job={job} live={data.live} similar={data.similar} />
    </div>
  );
}
