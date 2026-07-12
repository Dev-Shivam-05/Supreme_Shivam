import { cn } from "@/lib/utils";
import type { CoverPattern } from "@/lib/site";

/** Generative, coded cover motifs — no stock photography. Lime on carbon. */
function Motif({ pattern }: { pattern: CoverPattern }) {
  const a = "var(--accent)";
  if (pattern === "wave") {
    return (
      <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M0 ${50 + i * 14} C 40 ${30 + i * 14}, 60 ${70 + i * 14}, 100 ${50 + i * 14} S 160 ${30 + i * 14}, 200 ${50 + i * 14}`}
            fill="none"
            stroke={a}
            strokeWidth="0.7"
            opacity={0.5 - i * 0.09}
          />
        ))}
      </svg>
    );
  }
  if (pattern === "nodes") {
    const pts = [
      [30, 40], [80, 25], [140, 55], [55, 90], [110, 100], [165, 95], [95, 60],
    ];
    return (
      <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        {pts.map((p, i) =>
          pts.slice(i + 1).map((q, j) => {
            const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
            if (d > 70) return null;
            return <line key={`${i}-${j}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={a} strokeWidth="0.5" opacity="0.35" />;
          }),
        )}
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === 6 ? 3 : 1.8} fill={a} opacity={i === 6 ? 1 : 0.7} />
        ))}
      </svg>
    );
  }
  if (pattern === "orbit") {
    return (
      <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <g transform="translate(100 70)">
          {[24, 42, 60].map((r, i) => (
            <circle key={r} r={r} fill="none" stroke={a} strokeWidth="0.6" opacity={0.4 - i * 0.08} />
          ))}
          <g style={{ transformOrigin: "0 0", animation: "orbit-spin 14s linear infinite" }}>
            <circle cx="60" cy="0" r="3" fill={a} />
          </g>
          <g style={{ transformOrigin: "0 0", animation: "orbit-spin 9s linear infinite reverse" }}>
            <circle cx="42" cy="0" r="2" fill={a} opacity="0.7" />
          </g>
          <circle r="3" fill={a} />
        </g>
      </svg>
    );
  }
  if (pattern === "scan") {
    return (
      <div className="scanlines relative h-full w-full">
        <div
          className="absolute inset-x-0 h-8"
          style={{
            background: `linear-gradient(to bottom, transparent, color-mix(in oklch, ${a} 24%, transparent), transparent)`,
            animation: "scan-move 4.5s ease-in-out infinite",
          }}
        />
      </div>
    );
  }
  // grid — crosshair field
  return (
    <svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      {Array.from({ length: 5 }).map((_, r) =>
        Array.from({ length: 7 }).map((_, c) => {
          const x = 20 + c * 27;
          const y = 20 + r * 26;
          return (
            <g key={`${r}-${c}`} stroke={a} strokeWidth="0.6" opacity={(r + c) % 3 === 0 ? 0.6 : 0.22}>
              <line x1={x - 3} y1={y} x2={x + 3} y2={y} />
              <line x1={x} y1={y - 3} x2={x} y2={y + 3} />
            </g>
          );
        }),
      )}
    </svg>
  );
}

export function ProjectCover({
  pattern,
  index,
  label,
  imageUrl,
  className,
}: {
  pattern: CoverPattern;
  index: string;
  label?: string;
  imageUrl?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-bg-elev", className)}>
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-elev via-bg-elev/10 to-transparent" />
        </>
      ) : (
        <>
          <div className="grid-bg absolute inset-0 opacity-50" />
          <div className="absolute inset-0 opacity-70">
            <Motif pattern={pattern} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-bg-elev via-bg-elev/10 to-transparent" />
          <div className="pointer-events-none absolute -right-3 -top-10 select-none font-poster text-[10rem] leading-none text-fg/[0.05]">
            {index}
          </div>
        </>
      )}
      {label && <div className="hud absolute bottom-4 left-4">{label}</div>}
    </div>
  );
}
