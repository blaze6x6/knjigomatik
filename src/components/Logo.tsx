export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <rect width="64" height="64" rx="14" fill="#8c2f39" />
      <path d="M32 20C27 17 20 16 14 17V46C20 45 27 46 32 49C37 46 44 45 50 46V17C44 16 37 17 32 20Z" fill="#f7efe0" />
      <path d="M32 20V49" stroke="#8c2f39" strokeWidth="2" />
      <path d="M40 16.6V33l2.5-2.5L45 33V17.2Z" fill="#c9a24a" />
    </svg>
  );
}
