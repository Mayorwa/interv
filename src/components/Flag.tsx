import { useEffect, useRef } from "react";
import { flagCanvas } from "@/lib/flags";
import { cn } from "@/lib/utils";

/** The same flag the scene paints, reused in the panels. */
export function Flag({ country, className }: { country: string; className?: string }) {
  const host = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    node.replaceChildren();
    const source = flagCanvas(country);
    const image = new Image();
    image.src = source.toDataURL();
    image.alt = country;
    image.className = "h-full w-full object-cover";
    node.append(image);
  }, [country]);

  return (
    <span
      ref={host}
      title={country}
      className={cn("inline-block overflow-hidden rounded-[2px] bg-muted", className)}
    />
  );
}
