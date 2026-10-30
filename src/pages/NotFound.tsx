import { Link } from "@/lib/router-compat";
import { Compass } from "lucide-react";
import { useSeo } from "@/lib/seo";

const NotFound = () => {
  useSeo({ title: "Página não encontrada", noindex: true });

  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-elegant">
        <Compass className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="mt-6 font-display text-5xl font-bold">404</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        A página que você procura não existe, foi movida ou ainda não foi publicada.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex h-12 items-center rounded-2xl bg-primary px-8 font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
        >
          Voltar para o início
        </Link>
        <Link
          to="/blog"
          className="inline-flex h-12 items-center rounded-2xl border border-border bg-card px-8 font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Ver o blog
        </Link>
        <Link
          to="/busca"
          className="inline-flex h-12 items-center rounded-2xl border border-border bg-card px-8 font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Buscar
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
