import { useEffect } from "react";
import { Link } from "@/lib/router-compat";
import { CONDUTA_STORAGE_KEY } from "@/content/irmandade/codigo-de-conduta";

/** Aceite do código de conduta (doc 09 §1.3): checkbox obrigatório, lembrado no navegador. */
export function ConductCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  useEffect(() => {
    try {
      if (localStorage.getItem(CONDUTA_STORAGE_KEY) === "1") onChange(true);
    } catch {
      /* sem storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const set = (v: boolean) => {
    onChange(v);
    try {
      localStorage.setItem(CONDUTA_STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* sem storage */
    }
  };
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => set(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-primary"
        required
      />
      <span>
        Li e aceito o{" "}
        <Link
          to="/irmandade#codigo-de-conduta"
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          código de conduta da Irmandade
        </Link>
        : falo como homem adulto, honro a esposa e a mãe dos meus filhos, conto o que vivi e não
        vendo nada.
      </span>
    </label>
  );
}
