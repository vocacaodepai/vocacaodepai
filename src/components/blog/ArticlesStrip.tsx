import { useEffect, useState } from "react";
import { fetchPublishedPosts } from "@/lib/db";
import type { PostWithRelations } from "@/lib/types";
import { PostCard } from "./PostCard";

/** Artigos recentes para fechar páginas e manter a pessoa consumindo o blog. */
export function ArticlesStrip({ title = "Continue lendo" }: { title?: string }) {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);

  useEffect(() => {
    fetchPublishedPosts({ limit: 3 })
      .then((res) => setPosts(res.posts))
      .catch(() => setPosts([]));
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="mt-14" aria-labelledby="strip-articles">
      <h2 id="strip-articles" className="font-display text-2xl font-bold">
        {title}
      </h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
