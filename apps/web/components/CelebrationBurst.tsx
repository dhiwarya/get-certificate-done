"use client";

import { useEffect } from "react";
import { PartyPopper } from "lucide-react";

const particles = Array.from({ length: 14 }, (_, index) => index);

export function CelebrationBurst({ major = false, onDone }: { major?: boolean; onDone: () => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(onDone, major ? 1300 : 850);
    return () => window.clearTimeout(timeout);
  }, [major, onDone]);

  return <div className={`celebration ${major ? "celebration-major" : "celebration-compact"}`} aria-hidden="true">
    {major && <div className="celebration-message"><PartyPopper size={28} /><strong>Quest complete!</strong></div>}
    {particles.map((index) => <i key={index} style={{ "--particle": index } as React.CSSProperties} />)}
  </div>;
}
