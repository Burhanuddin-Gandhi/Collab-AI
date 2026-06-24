import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const headingRef = useRef(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactLoading, setContactLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Scramble text effect
  useEffect(() => {
    const el = headingRef.current;
    if (!el) return;

    const finalText = "Real-time meetings. Powered by AI.";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#░▒▓";

    const scramble = () => {
      let iteration = 0;
      clearInterval(el._interval);
      el._interval = setInterval(() => {
        el.innerText = finalText
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) return finalText[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");
        iteration += 0.5;
        if (iteration >= finalText.length) {
          clearInterval(el._interval);
          el.innerText = finalText;
        }
      }, 28);
    };

    // Play on mount after short delay
    const t = setTimeout(scramble, 400);

    // Replay on hover
    el.addEventListener("pointerenter", scramble);
    return () => {
      clearTimeout(t);
      clearInterval(el._interval);
      el.removeEventListener("pointerenter", scramble);
    };
  }, []);

  const handleContact = (e) => {
    e.preventDefault();
    setContactLoading(true);
    setTimeout(() => { setSent(true); setContactLoading(false); setContactForm({ name: "", email: "", message: "" }); }, 1000);
  };

  return (
    <div style={styles.root}>
      <style>{css}</style>

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>⚡ CollabAI</div>
        <div style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>Features</a>
          <a href="#how" style={styles.navLink}>How It Works</a>
          <a href="#contact" style={styles.navLink}>Contact</a>
        </div>
        <div style={styles.navActions}>
          <button style={styles.navLogin} onClick={() => navigate("/auth")}>Log In</button>
          <button style={styles.navSignup} onClick={() => navigate("/auth", { state: { register: true } })}>Sign Up Free</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroBadge}>✦ Now with Gemini AI</div>
          <h1
            ref={headingRef}
            style={styles.heroTitle}
            className="scramble-heading"
          >
            Real-time meetings. Powered by AI.
          </h1>
          <p style={styles.heroDesc}>
            CollabAI is a real-time meeting collaboration platform where your team
            can chat, share files, and get AI-powered insights — all without leaving the room.
          </p>
          <div style={styles.heroActions}>
            <button style={styles.heroPrimary} onClick={() => navigate("/auth", { state: { register: true } })}>
              Start for Free →
            </button>
            <button style={styles.heroSecondary} onClick={() => document.getElementById("how").scrollIntoView({ behavior: "smooth" })}>
              See how it works
            </button>
          </div>
          <div style={styles.proofRow}>
            {["#7ec8a4","#5aaa84","#3d8a68","#283830"].map((c, i) => (
              <div key={i} style={{ ...styles.proofAvatar, background: c, marginLeft: i === 0 ? 0 : "-8px" }} />
            ))}
            <span style={styles.proofText}>Built for real-time team collaboration</span>
          </div>
        </div>

        {/* Subtle rings decoration */}
        <div style={styles.ring1} />
        <div style={styles.ring2} />
        <div style={styles.decoGrid} />
      </section>

      {/* Features */}
      <section id="features" style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionTag}>CAPABILITIES</div>
          <h2 style={styles.sectionTitle}>Everything your meeting needs.</h2>
          <p style={styles.sectionDesc}>Built with MERN stack and Socket.io for true real-time performance.</p>

          <div style={styles.featGrid}>
            {[
              { icon: "⚡", title: "Real-Time Chat", desc: "Instant messaging with room-based isolation. Every message delivered in milliseconds via Socket.io with debounce and rate limiting." },
              { icon: "🤖", title: "AI Meeting Assistant", desc: "Powered by Gemini. Ask anything about your meeting — get summaries, suggestions, and insights on demand directly in the chat panel." },
              { icon: "📄", title: "Auto Summaries", desc: "When the meeting ends, AI generates a structured summary saved for every participant and downloadable as a formatted PDF." },
              { icon: "📎", title: "File Sharing", desc: "Share images and PDFs directly in the chat. Images render inline, PDFs open in the browser with a single click." },
              { icon: "👥", title: "Live Presence", desc: "See who is active, idle, or offline in real time using the Page Visibility API. No polling — completely event-driven." },
              { icon: "🔒", title: "Secure by Design", desc: "JWT authentication, rate-limited routes, debounced socket events, and isolated room architecture protect every session." },
            ].map((f) => (
              <div key={f.title} style={styles.featCard} className="feat-card">
                <div style={styles.featIcon}>{f.icon}</div>
                <div style={styles.featTitle}>{f.title}</div>
                <div style={styles.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={styles.sectionAlt}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionTag}>HOW IT WORKS</div>
          <h2 style={styles.sectionTitle}>Up and running in seconds.</h2>
          <div style={styles.stepsRow}>
            {[
              { num: "01", title: "Create a Room", desc: "Give your meeting a title and get a unique 6-character room ID instantly. No setup, no configuration needed." },
              { num: "02", title: "Share the ID", desc: "Share the room ID with your team. Anyone with it can join from anywhere." },
              { num: "03", title: "Collaborate", desc: "Chat, share files, ask the AI anything, and get a downloadable summary when the meeting ends." },
            ].map((s) => (
              <div key={s.num} style={styles.stepCard}>
                <div style={styles.stepNum}>{s.num}</div>
                <div style={styles.stepTitle}>{s.title}</div>
                <div style={styles.stepDesc}>{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
            <button style={styles.heroPrimary} onClick={() => navigate("/auth", { state: { register: true } })}>
              Get Started Free →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" style={styles.footer}>
        <div style={styles.footerTop}>
          <div style={styles.footerBrand}>
            <div style={styles.footerLogo}>⚡ CollabAI</div>
            <p style={styles.footerTagline}>Reinventing the meeting room.</p>
            <p style={styles.footerDesc}>A real-time collaboration platform built for teams who value clarity, speed, and AI-assisted productivity.</p>
          </div>
          <div style={styles.footerColumns}>
            <div style={styles.footerCol}>
              <div style={styles.footerColTitle}>Product</div>
              <button style={styles.footerLink} onClick={() => navigate("/auth", { state: { register: true } })}>Get Started</button>
              <button style={styles.footerLink} onClick={() => navigate("/auth")}>Log In</button>
            </div>
            <div style={styles.footerCol}>
              <div style={styles.footerColTitle}>Resources</div>
              <button style={styles.footerLink}>Documentation</button>
              <button style={styles.footerLink}>Privacy Policy</button>
              <button style={styles.footerLink}>Terms of Service</button>
            </div>
            <div style={styles.footerCol}>
              <div style={styles.footerColTitle}>Community</div>
              <a href="https://github.com/Burhanuddin-Gandhi"  style={styles.footerAnchor}>GitHub</a>
              <a href="https://linkedin.com/in/burhanuddin-gandhi-3a97a82a6" style={styles.footerAnchor}>LinkedIn</a>
            </div>
            <div style={{ ...styles.footerCol, minWidth: "220px" }}>
              <div style={styles.footerColTitle}>Contact Us</div>
              {sent ? (
                <div style={{ fontSize: "13px", color: "#7ec8a4", padding: "0.5rem 0" }}>✓ Message sent!</div>
              ) : (
                <form onSubmit={handleContact} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input style={styles.contactInput} placeholder="Your name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
                  <input style={styles.contactInput} type="email" placeholder="Your email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required />
                  <textarea style={styles.contactTextarea} placeholder="Your message..." value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} rows={3} required />
                  <button type="submit" style={styles.contactBtn} disabled={contactLoading}>
                    {contactLoading ? "Sending..." : "Send Message →"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <span style={styles.footerCopy}>© {new Date().getFullYear()} CollabAI. All rights reserved.</span>
          <span style={styles.footerBuilt}>Built with ⚡ by Burhanuddin Gandhi</span>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  root: { minHeight: "100vh", background: "#171e1b", fontFamily: "'DM Sans', sans-serif", color: "#e4ede8", display: "flex", flexDirection: "column", overflowX: "hidden" },
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 2rem", height: "64px", borderBottom: "1px solid #3a5045",
    position: "sticky", top: 0, zIndex: 100, boxSizing: "border-box",
    background: "rgba(23,30,27,0.92)", backdropFilter: "blur(12px)",
  },
  navLogo: { fontSize: "17px", fontWeight: "700", color: "#7ec8a4", letterSpacing: "-0.02em" },
  navLinks: { display: "flex", gap: "2rem", position: "absolute", left: "50%", transform: "translateX(-50%)" },
  navLink: { fontSize: "15px", color: "#e4ede8", textDecoration: "none", fontWeight: "500", transition: "color 0.15s" },
  navActions: { display: "flex", gap: "10px", alignItems: "center" },
  navLogin: {
    background: "none", border: "1px solid #3a5045", color: "#e4ede8",
    borderRadius: "8px", padding: "8px 18px", cursor: "pointer",
    fontSize: "14px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
  },
  navSignup: {
    background: "#7ec8a4", border: "none", color: "#171e1b",
    borderRadius: "8px", padding: "8px 18px", cursor: "pointer",
    fontSize: "14px", fontWeight: "700", fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.15s",
  },
  hero: {
    position: "relative", overflow: "hidden",
    padding: "7rem 2rem 6rem", display: "flex", justifyContent: "center",
  },
  heroInner: {
    display: "flex", flexDirection: "column", alignItems: "center",
    textAlign: "center", maxWidth: "680px", gap: "1.75rem", zIndex: 1,
  },
  heroBadge: {
    fontSize: "12px", color: "#7ec8a4", fontWeight: "600",
    letterSpacing: "0.1em", background: "#1f2b25",
    border: "1px solid #3a5045", borderRadius: "20px", padding: "6px 18px",
  },
  heroTitle: {
    fontSize: "clamp(36px, 6vw, 62px)", fontWeight: "700",
    lineHeight: 1.1, letterSpacing: "-0.03em", color: "#e4ede8",
    cursor: "default", fontFamily: "'DM Mono', monospace",
    minHeight: "1.2em",
  },
  heroDesc: { fontSize: "17px", color: "#7a9688", lineHeight: 1.8, maxWidth: "520px" },
  heroActions: { display: "flex", gap: "14px", marginTop: "0.5rem" },
  heroPrimary: {
    background: "#7ec8a4", border: "none", color: "#171e1b",
    borderRadius: "10px", padding: "14px 30px", cursor: "pointer",
    fontSize: "15px", fontWeight: "700", fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.15s",
  },
  heroSecondary: {
    background: "none", border: "1px solid #3a5045", color: "#e4ede8",
    borderRadius: "10px", padding: "14px 30px", cursor: "pointer",
    fontSize: "15px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
  },
  proofRow: { display: "flex", alignItems: "center", gap: "12px" },
  proofAvatars: { display: "flex" },
  proofAvatar: { width: "26px", height: "26px", borderRadius: "50%", border: "2px solid #171e1b" },
  proofText: { fontSize: "13px", color: "#4a6358" },
  ring1: { position: "absolute", top: "-120px", right: "-120px", width: "540px", height: "540px", borderRadius: "50%", border: "1px solid rgba(126,200,164,0.06)", pointerEvents: "none" },
  ring2: { position: "absolute", top: "-80px", right: "-80px", width: "380px", height: "380px", borderRadius: "50%", border: "1px solid rgba(126,200,164,0.04)", pointerEvents: "none" },
  decoGrid: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: "linear-gradient(rgba(126,200,164,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(126,200,164,0.025) 1px, transparent 1px)",
    backgroundSize: "50px 50px",
  },
  section: { padding: "5rem 2rem" },
  sectionAlt: { padding: "5rem 2rem", background: "#1f2b25", borderTop: "1px solid #3a5045", borderBottom: "1px solid #3a5045" },
  sectionInner: { maxWidth: "1000px", margin: "0 auto" },
  sectionTag: { fontSize: "11px", color: "#7ec8a4", fontWeight: "700", letterSpacing: "0.12em", marginBottom: "10px" },
  sectionTitle: { fontSize: "26px", fontWeight: "700", color: "#e4ede8", letterSpacing: "-0.02em", marginBottom: "10px" },
  sectionDesc: { fontSize: "15px", color: "#7a9688", marginBottom: "2.5rem" },
  featGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "16px" },
  featCard: {
    background: "#1f2b25", border: "1px solid #3a5045",
    borderRadius: "14px", padding: "1.75rem",
    display: "flex", flexDirection: "column", gap: "12px", transition: "border-color 0.2s",
  },
  featIcon: { fontSize: "24px" },
  featTitle: { fontSize: "16px", fontWeight: "600", color: "#e4ede8" },
  featDesc: { fontSize: "14px", color: "#7a9688", lineHeight: 1.7 },
  stepsRow: { display: "flex", gap: "1.5rem", flexWrap: "wrap" },
  stepCard: {
    flex: 1, minWidth: "220px", background: "#283830", border: "1px solid #3a5045",
    borderRadius: "14px", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "12px",
  },
  stepNum: { fontSize: "32px", fontWeight: "700", color: "#3a5045", lineHeight: 1 },
  stepTitle: { fontSize: "16px", fontWeight: "600", color: "#e4ede8" },
  stepDesc: { fontSize: "14px", color: "#7a9688", lineHeight: 1.7 },
  footer: { background: "#1f2b25", borderTop: "1px solid #3a5045" },
  footerTop: { maxWidth: "1000px", margin: "0 auto", padding: "3.5rem 2rem 2.5rem", display: "flex", gap: "4rem", boxSizing: "border-box", flexWrap: "wrap" },
  footerBrand: { display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "240px", flexShrink: 0 },
  footerLogo: { fontSize: "16px", fontWeight: "700", color: "#7ec8a4", letterSpacing: "-0.02em" },
  footerTagline: { fontSize: "13px", color: "#7a9688", fontStyle: "italic" },
  footerDesc: { fontSize: "13px", color: "#4a6358", lineHeight: 1.7 },
  footerColumns: { flex: 1, display: "flex", gap: "2.5rem", flexWrap: "wrap" },
  footerCol: { display: "flex", flexDirection: "column", gap: "12px", minWidth: "110px" },
  footerColTitle: { fontSize: "13px", fontWeight: "700", color: "#e4ede8", marginBottom: "2px" },
  footerLink: { background: "none", border: "none", textAlign: "left", fontSize: "13px", color: "#7a9688", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "0", transition: "color 0.15s" },
  footerAnchor: { fontSize: "13px", color: "#7a9688", textDecoration: "none", transition: "color 0.15s", display: "block" },
  contactInput: { background: "#283830", border: "1px solid #3a5045", borderRadius: "8px", padding: "8px 12px", color: "#e4ede8", fontSize: "13px", outline: "none", fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s" },
  contactTextarea: { background: "#283830", border: "1px solid #3a5045", borderRadius: "8px", padding: "8px 12px", color: "#e4ede8", fontSize: "13px", outline: "none", fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s", resize: "none", lineHeight: 1.5 },
  contactBtn: { background: "#7ec8a4", border: "none", color: "#171e1b", borderRadius: "8px", padding: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "700", fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.15s" },
  footerBottom: { maxWidth: "1000px", margin: "0 auto", padding: "1.25rem 2rem", borderTop: "1px solid #3a5045", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" },
  footerCopy: { fontSize: "12px", color: "#4a6358" },
  footerBuilt: { fontSize: "12px", color: "#4a6358" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input:focus, textarea:focus { border-color: #7ec8a4 !important; }
  input::placeholder, textarea::placeholder { color: #4a6358; }
  button:hover { opacity: 0.85; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  a:hover { color: #7ec8a4 !important; }
  .feat-card:hover { border-color: #5aaa84 !important; }
  .scramble-heading { cursor: default; }
  @media (max-width: 680px) {
    nav div[style*="position: absolute"] { display: none !important; }
  }
`;
