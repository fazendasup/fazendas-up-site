/**
 * Design: "Editorial Sóbrio Corporativo"
 * Header: clean wordmark, simple horizontal nav, subtle scroll-elevation.
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

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-paper/90 backdrop-blur-md border-b border-ink/10 text-ink"
          : "bg-transparent text-paper"
      }`}
    >
      <div className="container flex h-[72px] min-w-0 items-center justify-between gap-3">
        <a href="#top" className="flex min-w-0 items-baseline gap-2">
          <span className="display-serif min-w-0 shrink text-[1.25rem] leading-none sm:text-[1.4rem]">Fazendas Up</span>
          <span className={`hidden sm:inline text-[0.7rem] tracking-wide ${scrolled ? "text-muted-foreground" : "text-paper/70"}`}>, Manaus / AM</span>
        </a>

        <nav className="hidden md:flex items-center gap-9">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`text-[0.875rem] transition-colors ${
                scrolled
                  ? "text-ink/75 hover:text-forest"
                  : "text-paper/85 hover:text-paper"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center">
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
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-[0.825rem]"
          aria-label="Abrir menu"
        >
          {open ? "Fechar" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-ink/10 bg-paper">
          <nav className="container py-4 flex flex-col gap-3">
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
