/**
 * Thin compatibility layer that exposes a react-router-dom-like API
 * on top of TanStack Router, so the ported pages/components keep working.
 */
import {
  Link as TanstackLink,
  Outlet as TanstackOutlet,
  useLocation as useTanstackLocation,
  useNavigate as useTanstackNavigate,
  useParams as useTanstackParams,
  useRouterState,
} from "@tanstack/react-router";
import * as React from "react";

const OutletContext = React.createContext<unknown>(undefined);

export function Outlet({ context }: { context?: unknown }) {
  return (
    <OutletContext.Provider value={context}>
      <TanstackOutlet />
    </OutletContext.Provider>
  );
}

type AnchorProps = Omit<React.ComponentPropsWithoutRef<"a">, "href">;

export interface LinkProps extends AnchorProps {
  to: string;
  replace?: boolean;
  state?: unknown;
  preventScrollReset?: boolean;
}

function splitTo(to: string) {
  const [pathAndSearch, hash] = to.split("#");
  const [pathname, search] = (pathAndSearch ?? "").split("?");
  return {
    to: pathname || "/",
    search: search ? Object.fromEntries(new URLSearchParams(search)) : undefined,
    hash: hash || undefined,
  };
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, state: _state, preventScrollReset: _prs, ...rest },
  ref,
) {
  const parts = splitTo(to);
  return (
    <TanstackLink
      ref={ref}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={parts.to as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      search={parts.search as any}
      hash={parts.hash}
      replace={replace}
      {...rest}
    />
  );
});

type NavLinkRenderProp<T> = T | ((props: { isActive: boolean; isPending: boolean }) => T);

export interface NavLinkProps extends Omit<LinkProps, "className" | "style" | "children"> {
  className?: NavLinkRenderProp<string | undefined>;
  style?: NavLinkRenderProp<React.CSSProperties | undefined>;
  children?: NavLinkRenderProp<React.ReactNode>;
  end?: boolean;
}

export function NavLink({ className, style, children, end, to, ...rest }: NavLinkProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const target = splitTo(to).to;
  const isActive =
    end || target === "/"
      ? pathname === target
      : pathname === target || pathname.startsWith(`${target}/`);
  const ctx = { isActive, isPending: false };

  return (
    <Link
      to={to}
      className={typeof className === "function" ? className(ctx) : className}
      style={typeof style === "function" ? style(ctx) : style}
      {...rest}
    >
      {typeof children === "function" ? children(ctx) : children}
    </Link>
  );
}

export function useLocation() {
  const location = useTanstackLocation();
  return {
    pathname: location.pathname,
    search: location.searchStr ?? "",
    hash: location.hash ? `#${location.hash}` : "",
    state: location.state,
    key: location.href,
  };
}

export function useParams<
  T extends Record<string, string | undefined> = Record<string, string | undefined>,
>() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useTanstackParams({ strict: false } as any) as T;
}

export function useNavigate() {
  const navigate = useTanstackNavigate();
  return React.useCallback(
    (to: string | number, options?: { replace?: boolean; state?: unknown }) => {
      if (typeof to === "number") {
        if (typeof window !== "undefined") window.history.go(to);
        return;
      }
      const parts = splitTo(to);
      void navigate({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        to: parts.to as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        search: (parts.search ?? {}) as any,
        hash: parts.hash,
        replace: options?.replace,
      });
    },
    [navigate],
  );
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate(to, { replace });
  }, [navigate, to, replace]);
  return null;
}

type SearchParamsInit = URLSearchParams | Record<string, string> | string;

export function useSearchParams(): [
  URLSearchParams,
  (next: SearchParamsInit, options?: { replace?: boolean }) => void,
] {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr ?? "" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useTanstackNavigate();

  const params = React.useMemo(() => new URLSearchParams(searchStr), [searchStr]);

  const setParams = React.useCallback(
    (next: SearchParamsInit, options?: { replace?: boolean }) => {
      const usp =
        next instanceof URLSearchParams
          ? next
          : new URLSearchParams(next as Record<string, string>);
      void navigate({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        to: pathname as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        search: Object.fromEntries(usp) as any,
        replace: options?.replace,
      });
    },
    [navigate, pathname],
  );

  return [params, setParams];
}

export function useOutletContext<T = unknown>(): T {
  return React.useContext(OutletContext) as T;
}
