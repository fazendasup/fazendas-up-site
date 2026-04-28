/**
 * Design: "Editorial Sóbrio Corporativo"
 * Contact + Footer — institutional contact section + four-column corporate footer.
 */
import { ArrowUpRight } from "lucide-react";

const channels = [
  { label: "Telefone / WhatsApp", value: "(92) 98404-0397", href: "https://wa.me/5592984040397" },
  { label: "Comercial", value: "vendas@fazendasup.com.br", href: "mailto:vendas@fazendasup.com.br" },
];

const footerCols = [
  {
    title: "Empresa",
    links: [
      { label: "Sobre", href: "#sobre" },
      { label: "Tecnologia", href: "#tecnologia" },
      { label: "Sustentabilidade", href: "#impacto" },
      { label: "Trabalhe conosco", href: "https://www.linkedin.com/company/fazendasup" },
    ],
  },
  {
    title: "Produtos",
    links: [
      { label: "Microverdes", href: "#cultivos" },
      { label: "Alfaces Salanova", href: "#cultivos" },
      { label: "Flores comestíveis", href: "#cultivos" },
      { label: "Clube de assinatura", href: "https://www.fazendasup.com.br/" },
    ],
  },
  {
    title: "Atendimento",
    links: [
      { label: "Para chefs", href: "#contato" },
      { label: "Para mercados", href: "#contato" },
      { label: "FAQ", href: "#contato" },
      { label: "Política de privacidade", href: "https://www.fazendasup.com.br/" },
    ],
  },
  {
    title: "Conecte-se",
    links: [
      { label: "Instagram", href: "https://www.instagram.com/fazendasup/" },
      { label: "LinkedIn", href: "https://www.linkedin.com/company/fazendasup" },
    ],
  },
];

export function ContactFooter() {
  return (
    <>
      {/* Contact CTA section */}
      <section
        id="contato"
        className="relative scroll-mt-20 overflow-x-hidden overflow-y-visible bg-forest-dark py-24 text-paper md:scroll-mt-24 md:py-28 lg:h-screen lg:overflow-x-visible lg:py-10"
      >
        {/* Curved seam from previous section */}
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden
          className="absolute -top-px inset-x-0 w-full h-[80px] md:h-[120px] text-forest-dark"
        >
          <path d="M0,0 L1440,0 L1440,80 Q1080,0 720,80 T0,80 Z" fill="currentColor" />
        </svg>

        <div className="container relative z-10 min-w-0 lg:flex lg:h-full lg:flex-col lg:justify-center [&>*]:min-w-0">
          <div className="grid grid-cols-12 gap-8 lg:gap-12 [&>*]:min-w-0">
            <div className="col-span-12 min-w-0 lg:col-span-7 lg:flex lg:flex-col lg:justify-center">
              <p className="eyebrow text-on-plum-soft mb-6 inline-flex max-w-full flex-wrap items-center gap-3">
                <span className="h-px w-9 shrink-0 bg-on-plum-soft/70" />
                <span className="min-w-0">Contato</span>
              </p>
              <h2 className="display-head hyphens-auto text-paper text-[clamp(1.85rem,5.2vw+0.35rem,4.5rem)] leading-[1.08] sm:leading-[1.05] md:leading-none md:text-[clamp(2.2rem,5.2vw,4.5rem)]">
                Vamos conversar sobre{" "}
                <br className="hidden md:block" />
                o seu próximo <em className="text-brand-rose">projeto</em>.
              </h2>
              <p className="mt-5 max-w-full text-on-plum-strong/95 text-[1rem] font-light leading-[1.68] md:max-w-xl">
                Atendemos chefs, restaurantes, mercados e parceiros institucionais.
                Conte para nós o seu projeto.
              </p>
            </div>

            <div className="col-span-12 min-w-0 lg:col-span-5 lg:flex lg:flex-col lg:justify-center lg:pt-2">
              <ul className="divide-y divide-on-plum-soft/30 border-y border-on-plum-soft/30">
                {channels.map((c) => (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex min-w-0 items-start justify-between gap-3 py-5 transition-all hover:px-1 sm:hover:px-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 text-[0.7rem] tracking-[0.12em] text-on-plum-muted uppercase">
                          {c.label}
                        </div>
                        <div className="break-words text-paper text-[clamp(1.05rem,4.2vw,1.3rem)] font-medium leading-tight">
                          {c.value}
                        </div>
                      </div>
                      <ArrowUpRight className="mt-1 size-5 shrink-0 text-on-plum-muted transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-rose" />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-[0.85rem] text-on-plum-soft leading-relaxed">
                <strong className="text-on-plum-strong font-medium">Endereço operacional:</strong><br />
                Manaus, AM, Brasil
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}

      <footer className="overflow-x-hidden border-t border-on-plum-soft/25 bg-forest text-paper lg:overflow-x-visible">
        <div className="container min-w-0 py-16">
          <div className="grid grid-cols-12 gap-10 [&>*]:min-w-0">
            <div className="col-span-12 min-w-0 lg:col-span-4">
              <div className="display-serif text-paper text-[1.9rem] leading-none">Fazendas Up</div>
              <p className="text-paper/65 text-[0.95rem] leading-[1.7] font-light max-w-sm mt-5">
                Agroindústria sustentável de cultivo vertical. Produzindo alimento limpo
                no coração da Amazônia desde 2024.
              </p>
            </div>

            {footerCols.map((col) => (
              <div key={col.title} className="col-span-6 min-w-0 lg:col-span-2">
                <h4 className="text-paper text-[0.78rem] tracking-[0.12em] uppercase mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        target={l.href.startsWith("http") ? "_blank" : undefined}
                        rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                        className="break-words text-paper/65 text-[0.875rem] transition-colors hover:text-paper"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-6 border-t border-paper/10 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-[0.8rem] text-paper/50">
            <div>© 2026 Fazendas Up. Todos os direitos reservados.</div>
            <div>Manaus / AM · Brasil</div>
          </div>
        </div>
      </footer>
    </>
  );
}
