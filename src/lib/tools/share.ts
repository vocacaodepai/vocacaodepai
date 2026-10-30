import { toast } from "sonner";

export async function shareOrCopy(opts: { title: string; text: string; url: string }) {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share(opts);
      return "shared" as const;
    }
    await navigator.clipboard.writeText(`${opts.text}\n${opts.url}`);
    toast.success("Resultado copiado. Cole onde quiser.");
    return "copied" as const;
  } catch {
    toast.error("Não foi possível compartilhar. Copie o link da barra do navegador.");
    return "failed" as const;
  }
}

export async function copyText(text: string, ok = "Copiado.") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(ok);
    return true;
  } catch {
    toast.error("Não foi possível copiar.");
    return false;
  }
}
