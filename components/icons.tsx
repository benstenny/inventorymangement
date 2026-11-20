/**
 * The app's icon set: one stroke weight, round caps, drawn on a 24px grid.
 * Icons are decorative (aria-hidden); the control around them carries the label.
 */

type IconProps = { className?: string; size?: number };

function Svg({ className, size = 24, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

/** A clothes hanger: the inventory. */
export function HangerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.2 6.6a1.9 1.9 0 1 1 2.7 1.7c-.6.3-.9.7-.9 1.3v.9" />
      <path d="M12 10.5 3.6 16.4c-.9.6-.5 1.9.6 1.9h15.6c1.1 0 1.5-1.3.6-1.9L12 10.5Z" />
    </Svg>
  );
}

/** A taped-up package: Pack today. */
export function BoxIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.5 7.7 12 3.2 3.5 7.7v8.6l8.5 4.5 8.5-4.5V7.7Z" />
      <path d="m3.5 7.7 8.5 4.6 8.5-4.6" />
      <path d="M12 12.3v8.5" />
      <path d="m7.8 5.4 8.4 4.6" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

/** A folded bill: money and reports. */
export function MoneyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6.5 9.5v.01M17.5 14.5v.01" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9.5 6 6 6-6 6" />
    </Svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m14.5 6-6 6 6 6" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </Svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </Svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" />
    </Svg>
  );
}

/**
 * A gel-pen check mark. With `draw`, the stroke inks itself on once
 * (see .gel-tick in globals.css; Reduce Motion skips the animation).
 */
export function GelTick({ className, size = 18, draw = false }: IconProps & { draw?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      data-draw={draw}
      className={`gel-tick ${className ?? ""}`}
    >
      <path d="M4.5 12.8c2.2 1.5 3.6 3.2 4.6 5.2C11.4 12 15 7.6 19.8 5" />
    </svg>
  );
}

/** An open gel-pen circle: a step not done yet. */
export function GelCircle({ className, size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <path d="M12 4.2c4.5-.3 7.9 3 7.8 7.6-.1 4.4-3.6 7.9-8 7.9-4.3 0-7.6-3.4-7.5-7.8.1-3.4 2.3-6.2 5.6-7.3" />
    </svg>
  );
}
