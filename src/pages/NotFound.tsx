import { Link } from "@/lib/router-compat";
import { Heart } from "lucide-react";
import { useSeo } from "@/lib/seo";

const NotFound = () => {
  useSeo({ title: "404", noindex: true });

  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-primary text-white shadow-elegant">
        <Heart className="h-8 w-8" />
      </span>
      <h1 className="mt-6 font-display text-5xl font-bold">404</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        {"O conteúdo que você procura pode ter sido movido ou removido."}
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex h-12 items-center rounded-2xl bg-primary px-8 font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
      >
        {"Voltar para o início"}
      </Link>
    </div>
  );
};

export default NotFound;
