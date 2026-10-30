import { createFileRoute, notFound } from "@tanstack/react-router";
import JobPage from "@/pages/pai-indica-pai/JobPage";
import { getJobBySlug } from "@/lib/pai-indica-pai/functions";
import { jobPostingJsonLd } from "@/lib/pai-indica-pai/jsonld";
import { formatLocation } from "@/lib/pai-indica-pai/format";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

// Página da vaga (doc 08 §3.3, §8.1): JSON-LD JobPosting só quando ao vivo; encerrada = noindex sem JSON-LD.
export const Route = createFileRoute("/_site/pai-indica-pai/vagas/$slug")({
  loader: async ({ params }) => {
    const data = await getJobBySlug({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const data = loaderData;
    if (!data)
      return { meta: [{ title: `Vaga | ${SITE_NAME}` }, { name: "robots", content: "noindex" }] };
    const { job, live } = data;
    const url = `${SITE_URL}/pai-indica-pai/vagas/${job.slug}`;
    const title = `${job.title} — ${job.company} (${formatLocation(job)}) | Pai Indica Pai`;
    const description = live
      ? `${job.title} na ${job.company}, ${formatLocation(job)}. Vaga indicada por um pai, moderada pelo Vocação de Pai. Veja como se candidatar.`
      : `Esta vaga na ${job.company} foi encerrada. Veja vagas semelhantes no Pai Indica Pai.`;
    const scripts = [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Pai Indica Pai", path: "/pai-indica-pai" },
            { name: "Vagas", path: "/pai-indica-pai/vagas" },
            { name: job.title, path: `/pai-indica-pai/vagas/${job.slug}` },
          ]),
        ),
      },
    ];
    if (live)
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify(jobPostingJsonLd(job, url)),
      });
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(live ? [] : [{ name: "robots", content: "noindex" }]),
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: SITE_OG_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
  component: JobPage,
});
