import { faqs } from "@/lib/site";

/** Native <details> accordion — accessible and works without JS. */
export function Faq() {
  return (
    <section className="container-x border-t border-border py-20 md:py-28">
      <div className="grid gap-12 md:grid-cols-[0.7fr_1fr] md:gap-20">
        <div>
          <p className="hud tick mb-6">Questions</p>
          <h2 className="font-poster display-3">
            Good to <span className="text-accent">know.</span>
          </h2>
        </div>
        <div className="border-t border-border">
          {faqs.map((f) => (
            <details key={f.q} className="group border-b border-border py-6">
              <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                <span className="font-display text-lg font-medium text-fg md:text-xl">{f.q}</span>
                <span className="grid h-7 w-7 shrink-0 place-items-center border border-border font-mono text-fg-muted transition-colors group-open:border-accent group-open:text-accent">
                  <span className="transition-transform duration-300 group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-4 max-w-2xl text-fg-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
