import type { ComponentPropsWithoutRef } from "react";

type DineBellIconProps = ComponentPropsWithoutRef<"svg">;

export function DineBellIcon({ className, ...props }: DineBellIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M20 7.5H28C29.7 7.5 31 8.8 31 10.5C31 12.2 29.7 13.5 28 13.5H20C18.3 13.5 17 12.2 17 10.5C17 8.8 18.3 7.5 20 7.5Z" fill="currentColor" />
      <path d="M21.5 13H26.5V17H21.5V13Z" fill="currentColor" />
      <path d="M11 31.5C11 22.1 16.8 15.5 24 15.5C31.2 15.5 37 22.1 37 31.5V33H11V31.5Z" fill="currentColor" />
      <path d="M8 35.5C8 34.7 8.7 34 9.5 34H38.5C39.3 34 40 34.7 40 35.5V37C40 38.1 39.1 39 38 39H10C8.9 39 8 38.1 8 37V35.5Z" fill="currentColor" />
      <path d="M14.5 29.5C14.5 23.8 17.2 20 21.1 18.4" stroke="#FFFDF9" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

interface DineBellWordmarkProps {
  className?: string;
  variant?: "default" | "inverse";
}

export function DineBellWordmark({
  className = "text-2xl",
  variant = "default"
}: DineBellWordmarkProps) {
  const dineColor = variant === "inverse" ? "text-[#FFFDF9]" : "text-[#25211F]";
  const bellColor = variant === "inverse" ? "text-[#D7B998]" : "text-[#A88B6B]";

  return (
    <span
      aria-label="DineBell"
      className={"inline-flex items-baseline whitespace-nowrap font-semibold leading-none tracking-[-0.075em] " + className}
    >
      <span className={dineColor}>Dine</span>
      <span className={bellColor}>Bell</span>
    </span>
  );
}
