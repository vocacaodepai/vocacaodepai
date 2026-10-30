import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@/lib/router-compat";
import { likeStoryFn, myStoryLikeFn } from "@/lib/community.functions";
import { cn } from "@/lib/utils";

/** "Esse relato me ajudou · N": 1 por membro, alterna via rpc like_story (doc 09 §3.2). */
export function LikeStoryButton({
  storyId,
  initialCount,
}: {
  storyId: string;
  initialCount: number;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    myStoryLikeFn({ data: { storyId } })
      .then((r) => setLiked(r.liked))
      .catch(() => undefined);
  }, [user, storyId]);

  const toggle = async () => {
    if (!user) {
      navigate(`/entrar?next=/historias/${storyId}`);
      return;
    }
    setBusy(true);
    try {
      const r = await likeStoryFn({ data: { storyId } });
      setCount(r.likeCount);
      setLiked((v) => !v);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível registrar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-bold transition-colors",
        liked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary hover:text-primary",
      )}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      )}
      Esse relato me ajudou · {count}
    </button>
  );
}
