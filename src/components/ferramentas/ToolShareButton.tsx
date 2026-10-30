import { Share2 } from "lucide-react";
import { shareOrCopy } from "@/lib/tools/share";

export function ToolShareButton({
  title,
  text,
  url,
}: {
  title: string;
  text: string;
  url?: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        shareOrCopy({
          title,
          text,
          url: url ?? (typeof window !== "undefined" ? window.location.href : ""),
        })
      }
      className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-bold hover:border-primary"
    >
      <Share2 className="h-4 w-4" /> Compartilhar
    </button>
  );
}
