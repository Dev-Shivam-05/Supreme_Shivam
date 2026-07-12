/**
 * The brand loading screen — same lime + cursive SB monogram + LOAD SHIVAM as
 * the cold-open, but with an indeterminate bar. Rendered by app/loading.tsx so
 * it appears whenever a route takes time to load (slow network, data fetch).
 */
export function Loader() {
  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-[#cbff3c] text-[#0a0a08]">
      <div
        className="font-signature leading-none"
        style={{ fontSize: "clamp(7rem, 26vw, 20rem)", WebkitTextStroke: "1.5px #0a0a08" }}
      >
        SB
      </div>
      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3">
        <div className="h-px w-40 overflow-hidden bg-[#0a0a08]/20">
          <div className="loader-bar h-px bg-[#0a0a08]" />
        </div>
        <div className="font-poster text-sm tracking-[0.35em]">LOAD SHIVAM</div>
      </div>
    </div>
  );
}
