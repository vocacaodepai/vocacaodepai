import { createFileRoute, notFound } from "@tanstack/react-router";
import ProfessionalPage from "@/pages/pai-indica-pai/ProfessionalPage";
import { getProfessionalBySlug } from "@/lib/pai-indica-pai/functions";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

// Perfil público do Pai Profissional (doc 08 §3.5). `$id` = slug do perfil.
export const Route = createFileRoute("/_site/pai-indica-pai/profissionais/$id")({
  loader: async ({ params }) => {
    const pro = await getProfessionalBySlug({ data: { slug: params.id } });
    if (!pro) throw notFound();
    return pro;
  },
  head: ({ loaderData }) => {
    const pro = loaderData;
    if (!pro)
      return {
        meta: [
          { title: `Pai Profissional | ${SITE_NAME}` },
          { name: "robots", content: "noindex" },
        ],
      };
    const url = `${SITE_URL}/pai-indica-pai/profissionais/${pro.slug}`;
    const local =
      pro.city && pro.uf
        ? `${pro.city}/${pro.uf}`
        : pro.remote
          ? "atende remoto"
          : (pro.uf ?? "Brasil");
    const title = `${pro.profession} — ${pro.profile?.display_name ?? "Pai Profissional"} (${local}) | Pai Indica Pai`;
    const description = pro.description.slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
        { property: "og:image", content: pro.profile?.avatar_url ?? SITE_OG_IMAGE },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Pai Indica Pai", path: "/pai-indica-pai" },
              { name: "Pai Profissional", path: "/pai-indica-pai/profissionais" },
              { name: pro.profession, path: `/pai-indica-pai/profissionais/${pro.slug}` },
            ]),
          ),
        },
      ],
    };
  },
  component: ProfessionalPage,
});
