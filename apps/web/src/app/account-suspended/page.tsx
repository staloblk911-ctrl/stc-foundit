import Link from "next/link";

export default function AccountSuspendedPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="eyebrow">ACCOUNT ACCESS</p>
      <h1 className="mt-3 text-3xl font-semibold">Please contact the campus team</h1>
      <p className="mt-3 text-muted">
        This account can’t access reports or messages right now. If you think this is a mistake, contact your STC FoundIt administrator.
      </p>
      <Link href="/" className="mt-6 inline-flex rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface">
        Return home
      </Link>
    </div>
  );
}
