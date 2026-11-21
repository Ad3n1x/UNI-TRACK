import React from "react";
import "../styles/landing.css";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Activity, BellRing, ChartNoAxesCombined, CheckCircle2, Fingerprint, LockKeyhole, Sparkles, Target, Timer, Wallet, Zap } from "lucide-react";

const features = [
  { icon: Target, title: "Habits & goals", description: "Turn intentions into visible progress with focused daily check-ins and measurable targets." },
  { icon: Activity, title: "Flexible trackers", description: "Build counters, logs, timers, expense trackers and personal metrics around your routines." },
  { icon: ChartNoAxesCombined, title: "Progress at a glance", description: "Use your tracker workspace to review activity, spot patterns and keep momentum." },
  { icon: BellRing, title: "Useful reminders", description: "Enable browser notifications on supported devices so important check-ins are easier to remember." },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "UNI-TRACK by AD3N1X",
  alternateName: ["UNI-TRACK", "UNITRACK"],
  url: "https://unitrack-app.vercel.app/",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web browser",
  description: "A personal productivity and tracking application for habits, tasks, goals, counters and metrics.",
  author: {
    "@type": "Person",
    "@id": "https://ad3n1x.github.io/Portfolio/#person",
    name: "AD3N1X",
    url: "https://ad3n1x.github.io/Portfolio/",
    sameAs: ["https://github.com/Ad3n1x", "https://www.linkedin.com/in/adeniran-victor-ba28a7432/"],
  },
};

export default function UnitrackPage() {
  return (
    <>
      <Helmet>
        <title>UNI-TRACK by AD3N1X — A clearer way to track progress</title>
        <meta name="description" content="Build better routines with UNI-TRACK by AD3N1X. Organise habits, goals, tasks, counters and personal metrics in one focused tracking workspace." />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href="https://unitrack-app.vercel.app/" />
        <link rel="describedby" href="https://unitrack-app.vercel.app/llms.txt" />
        <meta property="og:title" content="UNI-TRACK by AD3N1X — A clearer way to track progress" />
        <meta property="og:description" content="A focused workspace for habits, goals, tasks and personal metrics." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://unitrack-app.vercel.app/" />
        <meta property="og:image" content="https://unitrack-app.vercel.app/logo.svg" />
        <meta property="og:site_name" content="UNI-TRACK by AD3N1X" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="UNI-TRACK by AD3N1X" />
        <meta name="twitter:description" content="A focused workspace for habits, goals, tasks and personal metrics." />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="ut-shell">
        <header className="ut-wrap ut-nav">
          <Link className="ut-brand" to="/" aria-label="UNI-TRACK home">
            <img src="/logo.svg" alt="" />
            <span><strong>UNI-TRACK</strong><small>BUILT BY AD3N1X</small></span>
          </Link>
          <nav className="ut-navlinks" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="/about.html">About</a>
            <a href="/faq.html">FAQ</a>
          </nav>
          <div className="ut-actions">
            <Link className="ut-btn ut-btn-quiet" to="/login">Sign in</Link>
            <Link className="ut-btn ut-btn-primary" to="/register">Get started <ArrowRight size={15} /></Link>
          </div>
        </header>

        <main>
          <section className="ut-wrap ut-hero">
            <div>
              <div className="ut-eyebrow"><Sparkles size={13} /> PERSONAL PROGRESS, MADE CLEAR</div>
              <h1>Make progress visible. <span>Stay in control.</span></h1>
              <p className="ut-lead">A focused workspace for habits, goals, tasks and personal metrics. Build trackers around the way you work, then use your progress to make better decisions.</p>
              <div className="ut-hero-actions">
                <Link className="ut-btn ut-btn-primary" to="/register">Create your free account <ArrowRight size={16} /></Link>
                <Link className="ut-btn ut-btn-quiet" to="/login">I already have an account</Link>
              </div>
              <div className="ut-trust">
                <span><CheckCircle2 size={14} /> Flexible tracker types</span>
                <span><LockKeyhole size={14} /> Account-scoped workspace</span>
                <span><Zap size={14} /> Browser-based</span>
              </div>
            </div>

            <div className="ut-preview" aria-label="Illustrative tracker dashboard preview">
              <div className="ut-preview-top">
                <div><div className="ut-preview-title">Your progress overview</div><div className="ut-preview-sub">A sample view of your tracker workspace</div></div>
                <span className="ut-live">WORKSPACE</span>
              </div>
              <div className="ut-statgrid">
                <div className="ut-stat"><div className="ut-stat-label">Daily habits</div><div className="ut-stat-value">04</div><div className="ut-stat-foot">Keep your rhythm</div></div>
                <div className="ut-stat"><div className="ut-stat-label">Active goals</div><div className="ut-stat-value">03</div><div className="ut-stat-foot">One step at a time</div></div>
                <div className="ut-stat"><div className="ut-stat-label">Focus time</div><div className="ut-stat-value">2.5h</div><div className="ut-stat-foot">Make time count</div></div>
                <div className="ut-stat"><div className="ut-stat-label">Logs this week</div><div className="ut-stat-value">18</div><div className="ut-stat-foot">Consistency matters</div></div>
              </div>
              <div className="ut-progress">
                <div className="ut-progress-head"><span>Weekly consistency</span><span>72%</span></div>
                <div className="ut-progress-track"><span /></div>
                <div className="ut-preview-note">Illustrative preview · not live account data</div>
              </div>
            </div>
          </section>

          <section id="features" className="ut-wrap ut-section">
            <div className="ut-section-head">
              <div className="ut-kicker">ONE WORKSPACE. YOUR SYSTEM.</div>
              <h2>Track what actually moves you forward.</h2>
              <p>Keep the important parts of your personal system together without turning progress into another complicated project.</p>
            </div>
            <div className="ut-feature-grid">
              {features.map(({ icon: Icon, title, description }) => (
                <article className="ut-feature" key={title}>
                  <div className="ut-feature-icon"><Icon size={19} /></div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="ut-wrap">
            <div className="ut-privacy">
              <div>
                <div className="ut-kicker" style={{ color: "#9bb8ff" }}>BUILT WITH CARE</div>
                <h2>Your progress is personal. Your controls should be clear.</h2>
                <p>UNI-TRACK is built around a personal tracking workspace. Review the product's privacy information to understand what is stored, how selected tracker data is protected, and what browser key recovery means.</p>
              </div>
              <div className="ut-privacy-points">
                <div className="ut-privacy-point"><Fingerprint size={17} /> Your trackers are tied to your signed-in account.</div>
                <div className="ut-privacy-point"><LockKeyhole size={17} /> Browser-held, non-extractable encryption keys support compatible encrypted records on this device.</div>
                <div className="ut-privacy-point"><Wallet size={17} /> Export tools help you keep a copy of your records.</div>
                <div className="ut-privacy-point"><Timer size={17} /> Reminder support depends on browser and device permissions.</div>
              </div>
            </div>
          </section>
        </main>

        <footer className="ut-wrap ut-bottom">
          <div className="ut-brand"><img src="/logo.svg" alt="" /><span><strong>UNI-TRACK</strong><small>AN AD3N1X PROJECT</small></span></div>
          <div className="ut-footer">
            <a href="/about.html">About</a><a href="/faq.html">FAQ</a><a href="https://github.com/Ad3n1x/UNI-TRACK" target="_blank" rel="noreferrer">Source code</a><a href="https://ad3n1x.github.io/Portfolio/" target="_blank" rel="noreferrer">AD3N1X</a>
          </div>
          <span style={{ color: "#94a3b8", fontSize: 11 }}>© {new Date().getFullYear()} UNI-TRACK</span>
        </footer>
      </div>
    </>
  );
}
