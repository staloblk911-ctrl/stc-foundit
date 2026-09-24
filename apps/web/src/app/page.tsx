import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
      <section className="hero-panel relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-20">
        <p className="eyebrow">KASDI MERBAH UNIVERSITY · CAMPUS COMMUNITY</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Lost something? <span className="text-gradient-brand">Let’s find it</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          A simple, trusted place for students to report lost belongings, share found items, and help them find their way home
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-black shadow-lg shadow-brand/15 hover:bg-brand-hover"
        >
          Join the campus community
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-border bg-surface/70 px-6 py-3 font-medium hover:border-brand/50 hover:bg-surface"
        >
          I already have an account
        </Link>
      </div>
      <p className="mt-5 text-xs text-muted">Sign in to browse reports or post a lost or found item</p>
      </section>

      <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
        <Feature
          number="Firstly"
          title="Tell us what’s missing"
          body="Share a few helpful details and where you last saw it"
        />
        <Feature
          number="Secondly"
          title="Find a possible match"
          body="We compare category, campus location, and date to surface likely matches"
        />
        <Feature
          number="Thirdly"
          title="Reconnect safely"
          body="Use private conversations to confirm details and arrange a return"
        />
      </div>
      <p className="mt-10 text-center text-xs text-muted">Built for the Kasdi Merbah University community </p>
      <p className="mt-11 text-center text-xs text-muted">STC The Way to Greatness </p>
    </div>
  );
}

function Feature({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="feature-card rounded-2xl border border-border bg-surface p-6 sm:p-7">
      <span className="text-xs font-semibold tracking-[0.2em] text-brand">{number}</span>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}
