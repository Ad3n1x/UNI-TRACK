import React from "react";
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
        <style>{`
          .ut-shell{min-height:100vh;background:#f6f8fc;color:#14213d;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
          .ut-wrap{width:min(1120px,calc(100% - 40px));margin:0 auto}
          .ut-nav{height:82px;display:flex;align-items:center;justify-content:space-between;gap:20px}
          .ut-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:#14213d}
          .ut-brand img{width:38px;height:38px}
          .ut-brand strong{font-size:17px;letter-spacing:-.5px}
          .ut-brand small{display:block;color:#71809a;font-size:10px;font-weight:800;letter-spacing:1.6px;margin-top:2px}
          .ut-navlinks{display:flex;align-items:center;gap:26px}
          .ut-navlinks a,.ut-footer a{color:#64748b;text-decoration:none;font-size:13px;font-weight:650}
          .ut-navlinks a:hover,.ut-footer a:hover{color:#315eea}
          .ut-actions{display:flex;gap:10px;align-items:center}
          .ut-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:11px;padding:12px 17px;text-decoration:none;font-size:13px;font-weight:750;transition:transform .18s ease,box-shadow .18s ease}
          .ut-btn:hover{transform:translateY(-2px)}
          .ut-btn-primary{background:#315eea;color:white;box-shadow:0 9px 22px rgba(49,94,234,.2)}
          .ut-btn-quiet{background:#fff;color:#263650;border:1px solid #e3e9f3}
          .ut-hero{display:grid;grid-template-columns:1.03fr .97fr;gap:58px;align-items:center;padding:68px 0 76px}
          .ut-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid #dfe7ff;border-radius:999px;background:#edf2ff;color:#315eea;font-size:10px;font-weight:850;letter-spacing:1.2px}
          .ut-hero h1{font-size:clamp(42px,5.5vw,66px);line-height:1.04;letter-spacing:-3.2px;margin:22px 0 20px;font-weight:850;color:#14213d}
          .ut-hero h1 span{color:#315eea}
          .ut-lead{max-width:520px;color:#64748b;font-size:16px;line-height:1.8;margin:0 0 28px}
          .ut-hero-actions{display:flex;gap:12px;flex-wrap:wrap}
          .ut-trust{display:flex;gap:18px;flex-wrap:wrap;margin-top:27px;color:#71809a;font-size:11px;font-weight:650}
          .ut-trust span{display:flex;align-items:center;gap:6px}
          .ut-preview{position:relative;border:1px solid #e4eaf4;border-radius:24px;background:#fff;padding:23px;box-shadow:0 28px 70px rgba(24,45,88,.1)}
          .ut-preview:before{content:"";position:absolute;z-index:0;inset:-18px 24px 22px -18px;border-radius:26px;background:#e9efff}
          .ut-preview>*{position:relative;z-index:1}
          .ut-preview-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}
          .ut-preview-title{font-size:13px;font-weight:800}
          .ut-preview-sub{font-size:10px;color:#94a3b8;margin-top:4px}
          .ut-live{font-size:9px;color:#0d966b;background:#e8f8f1;border-radius:999px;padding:6px 9px;font-weight:800}
          .ut-statgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
          .ut-stat{padding:15px;border:1px solid #edf1f7;border-radius:14px;background:#fbfcff}
          .ut-stat-label{font-size:10px;color:#8190a7;font-weight:650}
          .ut-stat-value{font-size:23px;font-weight:850;letter-spacing:-1px;margin-top:8px}
          .ut-stat-foot{font-size:9px;color:#0d966b;margin-top:5px}
          .ut-progress{margin-top:16px;border:1px solid #edf1f7;border-radius:15px;padding:16px}
          .ut-progress-head{display:flex;justify-content:space-between;font-size:11px;font-weight:750}
          .ut-progress-track{height:7px;background:#edf1f7;border-radius:20px;margin-top:12px;overflow:hidden}
          .ut-progress-track span{display:block;width:72%;height:100%;border-radius:20px;background:linear-gradient(90deg,#315eea,#70a0ff)}
          .ut-preview-note{font-size:9px;color:#9aa6b8;text-align:right;margin-top:9px}
          .ut-section{padding:50px 0 72px}
          .ut-section-head{text-align:center;max-width:620px;margin:0 auto 30px}
          .ut-kicker{color:#315eea;font-size:10px;font-weight:850;letter-spacing:1.5px}
          .ut-section h2{font-size:clamp(27px,3.3vw,38px);letter-spacing:-1.5px;margin:12px 0;color:#14213d}
          .ut-section-head p{font-size:14px;color:#71809a;line-height:1.75}
          .ut-feature-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
          .ut-feature{padding:22px 20px;border:1px solid #e6ebf3;border-radius:17px;background:#fff;min-height:180px}
          .ut-feature-icon{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;background:#edf2ff;color:#315eea}
          .ut-feature h3{font-size:14px;margin:17px 0 8px;font-weight:800}
          .ut-feature p{font-size:12px;color:#71809a;line-height:1.7;margin:0}
          .ut-privacy{display:grid;grid-template-columns:.85fr 1.15fr;gap:38px;align-items:center;padding:30px;border-radius:22px;background:#172746;color:white}
          .ut-privacy h2{font-size:29px;line-height:1.2;letter-spacing:-1px;margin:12px 0}
          .ut-privacy p{font-size:13px;color:#c3cde0;line-height:1.8;margin:0}
          .ut-privacy-points{display:grid;grid-template-columns:1fr 1fr;gap:12px}
          .ut-privacy-point{display:flex;gap:10px;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:13px;background:rgba(255,255,255,.05);font-size:11px;line-height:1.55;color:#e2e9f5}
          .ut-privacy-point svg{flex-shrink:0;color:#91b1ff}
          .ut-bottom{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:34px 0 42px;border-top:1px solid #e4eaf3;margin-top:55px}
          .ut-footer{display:flex;gap:20px;flex-wrap:wrap}
          @media(max-width:850px){.ut-hero{gap:34px;padding:50px 0 60px}.ut-feature-grid{grid-template-columns:repeat(2,1fr)}.ut-privacy{grid-template-columns:1fr;gap:22px}}
          @media(max-width:620px){.ut-wrap{width:min(calc(100% - 30px),520px)}.ut-nav{height:72px}.ut-navlinks{display:none}.ut-brand img{width:34px;height:34px}.ut-actions{gap:7px}.ut-btn{padding:11px 12px;font-size:12px}.ut-hero{grid-template-columns:1fr;padding:40px 0 52px;gap:38px}.ut-hero h1{font-size:45px;letter-spacing:-2.5px}.ut-lead{font-size:14px}.ut-preview{padding:17px}.ut-feature-grid{gap:10px}.ut-feature{padding:17px;min-height:190px}.ut-privacy{padding:22px}.ut-privacy-points{grid-template-columns:1fr}.ut-bottom{align-items:flex-start;flex-direction:column;margin-top:38px}}
          @media(prefers-reduced-motion:reduce){.ut-btn{transition:none}.ut-btn:hover{transform:none}}
        `}</style>

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
