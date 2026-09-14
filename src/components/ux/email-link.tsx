"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EMAIL_MASKED, emailAddress, emailHref } from "@/lib/email";

/**
 * A mail link whose `href` and text only exist after hydration. Before that —
 * and in the server HTML a harvester reads — it is an ordinary internal link to
 * the contact form, which is a working fallback rather than a dead end.
 */
export function EmailLink({
  className,
  label,
}: {
  className?: string;
  /** Fixed link text. Omit to show the address itself once it resolves. */
  label?: string;
}) {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => setHref(emailHref()), []);

  if (!href) {
    return (
      <Link href="/contact" className={className}>
        {label ?? EMAIL_MASKED}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {label ?? emailAddress()}
    </a>
  );
}

/** The address as text, resolved after hydration. Masked until then. */
export function EmailText() {
  const [value, setValue] = useState(EMAIL_MASKED);
  useEffect(() => setValue(emailAddress()), []);
  return <>{value}</>;
}
