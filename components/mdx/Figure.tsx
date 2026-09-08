import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

/**
 * Throws when alt text is missing or blank. Failing loudly is deliberate:
 * across 179 lessons a silent default would let unlabelled diagrams ship.
 */
export function Figure({ src, alt, caption, width = 1200, height = 675 }: Props) {
  if (typeof alt !== "string" || alt.trim().length === 0) {
    throw new Error(
      `<Figure src="${src}"> is missing alt text. Describe what the diagram shows, or use aria-hidden markup for purely decorative art.`,
    );
  }

  return (
    <figure className="my-8">
      <div className="rounded-card border-2 border-structural bg-card p-2">
        <Image src={src} alt={alt} width={width} height={height} className="h-auto w-full" />
      </div>
      {caption && (
        <figcaption className="mt-2 font-mono text-xs text-ink-muted">{caption}</figcaption>
      )}
    </figure>
  );
}
