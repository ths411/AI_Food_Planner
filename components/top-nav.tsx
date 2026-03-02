import Link from "next/link";

export default function TopNav() {
  return (
    <header className="border-b border-black/10 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-[var(--brand)]">
          AI Food Planner DK
        </Link>
        <div className="flex gap-4 text-sm text-[var(--muted)]">
          <Link href="/settings">Settings</Link>
          <Link href="/pantry">Pantry</Link>
          <Link href="/generate">Generate</Link>
        </div>
      </nav>
    </header>
  );
}

