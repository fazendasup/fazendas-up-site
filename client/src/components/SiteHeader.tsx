/**
 * Design: "Editorial Sóbrio Corporativo"
 * Header: clean wordmark, simple horizontal nav, subtle scroll-elevation.
 * Navegação desktop vs menu móvel só com breakpoint `lg` (CSS) — não depende de JS de largura.
 */
import { useEffect, useState } from "react";

const navItems = [
  { id: "tecnologia", label: "Tecnologia" },
  { id: "impacto", label: "Sustentabilidade" },
  { id: "cultivos", label: "Produtos" },
  { id: "sobre", label: "Sobre" },
  { id: "contato", label: "Contato" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const closeIfDesktop = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", closeIfDesktop);
    window.addEventListener("resize", closeIfDesktop);
    return () => {
      mq.removeEventListener("change", closeIfDesktop);
      window.removeEventListener("resize", closeIfDesktop);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 max-w-full overflow-x-hidden pt-[env(safe-area-inset-top,0px)] transition-all duration-500 ${
        scrolled
          ? "bg-paper/90 backdrop-blur-md border-b border-ink/10 text-ink"
          : "bg-transparent text-paper"
      }`}
    >
      <div className="container flex h-[72px] min-w-0 items-center justify-between gap-3 [&>*]:min-w-0">
        <a href="#top" className="flex min-w-0 items-baseline gap-2">
          <span className="display-serif min-w-0 shrink text-[1.25rem] leading-none sm:text-[1.4rem]">Fazendas Up</span>
          <span className={`hidden sm:inline text-[0.7rem] tracking-wide ${scrolled ? "text-muted-foreground" : "text-paper/70"}`}>, Manaus / AM</span>
        </a>

        <div className="hidden lg:flex items-center gap-9">
          <nav className="flex items-center gap-9">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`text-[0.875rem] transition-colors ${
                  scrolled ? "text-ink/75 hover:text-forest" : "text-paper/85 hover:text-paper"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="#contato"
            className={`inline-flex items-center px-4 py-2 rounded-full text-[0.825rem] font-medium transition-colors ${
              scrolled
                ? "bg-forest text-paper hover:bg-forest-dark"
                : "bg-paper text-ink hover:bg-clay hover:text-paper"
            }`}
          >
            Falar com a equipe
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 whitespace-nowrap text-[0.825rem] lg:hidden"
          aria-label="Abrir menu"
        >
          {open ? "Fechar" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink/10 bg-paper lg:hidden">
          <nav className="container flex flex-col gap-3 py-4 [&>*]:min-w-0">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setOpen(false)}
                className="text-[0.95rem] text-ink/80 py-2"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contato"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-forest text-paper text-[0.875rem] font-medium"
            >
              Falar com a equipe
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
