import Image from "next/image";

interface BrandAssetProps {
  className?: string;
  priority?: boolean;
}

/**
 * The official DineBell bell artwork, placed inside a square crop for compact UI.
 * The source image is retained as supplied; the positioning only hides its canvas margin.
 */
export function DineBellIcon({ className = "h-8 w-8", priority = false }: BrandAssetProps) {
  return (
    <span
      role="img"
      aria-label="DineBell bell"
      className={"relative inline-block shrink-0 overflow-hidden align-middle " + className}
    >
      <Image
        src="/brand/dinebell-bell.png"
        alt=""
        aria-hidden="true"
        width={1254}
        height={1254}
        sizes="48px"
        priority={priority}
        className="absolute block max-w-none mix-blend-multiply"
        style={{
          width: "154.8%",
          height: "auto",
          maxWidth: "none",
          left: "-27.4%",
          top: "-26.5%"
        }}
      />
    </span>
  );
}

/**
 * The official DineBell wordmark. The supplied source artwork remains unchanged;
 * the wrapper simply frames the wordmark without its export canvas.
 */
export function DineBellWordmark({
  className = "text-2xl",
  priority = false
}: BrandAssetProps) {
  return (
    <span
      role="img"
      aria-label="DineBell"
      className={
        "relative inline-block h-[1em] w-[5.45em] shrink-0 overflow-hidden align-[-0.12em] " +
        className
      }
    >
      <Image
        src="/brand/dinebell-wordmark.png"
        alt=""
        aria-hidden="true"
        width={1536}
        height={1024}
        sizes="(max-width: 640px) 176px, 260px"
        priority={priority}
        className="absolute block max-w-none mix-blend-multiply"
        style={{
          width: "142.2%",
          height: "auto",
          maxWidth: "none",
          left: "-21.9%",
          top: "-202%"
        }}
      />
    </span>
  );
}
