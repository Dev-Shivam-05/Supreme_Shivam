"use client";

import { cn } from "@/lib/utils";
import { Empty } from "./primitives";

export type Lead = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

const STATUSES = ["new", "read", "replied", "archived"];

export function Leads({ leads, onStatus }: { leads: Lead[]; onStatus: (id: string, s: string) => void }) {
  if (leads.length === 0) {
    return (
      <div className="border border-dashed border-border p-12">
        <Empty
          line="No enquiries yet"
          detail="The contact form is live and has been tested end to end. Nothing has come through it."
        />
      </div>
    );
  }

  return (
    <div className="deck-rise overflow-x-auto border border-border bg-bg-elev">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-fg-faint">
            <th className="p-3 font-mono text-xs font-normal uppercase tracking-wider">Name</th>
            <th className="p-3 font-mono text-xs font-normal uppercase tracking-wider">Message</th>
            <th className="p-3 font-mono text-xs font-normal uppercase tracking-wider">Received</th>
            <th className="p-3 font-mono text-xs font-normal uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-b border-border align-top last:border-0">
              <td className="p-3">
                <div className="font-medium text-fg">{l.name}</div>
                <a href={`mailto:${l.email}`} className="font-mono text-xs text-accent hover:underline">
                  {l.email}
                </a>
              </td>
              <td className="max-w-md p-3 text-fg-muted">
                {l.subject && <div className="mb-1 text-xs text-fg-faint">{l.subject}</div>}
                <div className="line-clamp-3">{l.message}</div>
              </td>
              <td className="whitespace-nowrap p-3 font-mono text-xs text-fg-faint">
                {new Date(l.createdAt).toISOString().slice(0, 10)}
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => onStatus(l.id, s)}
                      className={cn(
                        "px-2 py-1 font-mono text-[0.6rem] uppercase tracking-wider transition-colors duration-[160ms]",
                        l.status === s
                          ? "bg-accent text-accent-ink"
                          : "border border-border text-fg-muted hover:border-accent",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
