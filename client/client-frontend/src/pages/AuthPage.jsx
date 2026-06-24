import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, registerUser } from "../api/auth";
import toast from "react-hot-toast";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(!location.state?.register);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await loginUser({ email: form.email, password: form.password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        const res = await registerUser({ name: form.username, email: form.email, password: form.password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        toast.success("Account created!");
        navigate("/dashboard");
      }
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || "Something went wrong.";
      toast.error(message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.root}>
      <style>{css}</style>
      <div style={styles.card}>

        {/* Left panel */}
        <div style={styles.left}>
          <div style={styles.logo}>⚡ CollabAI</div>
          <div style={styles.leftBody}>
            <h2 style={styles.leftTitle}>
              {isLogin ? "Welcome back." : "Join CollabAI."}
            </h2>
            <p style={styles.leftDesc}>
              {isLogin
                ? "Log in to access your rooms, meeting history, and AI-powered collaboration tools."
                : "Create your account and start collaborating with your team in real time."}
            </p>
            <div style={styles.tagRow}>
              {["Real-time", "AI-Powered", "Secure"].map((t) => (
                <div key={t} style={styles.tag}>{t}</div>
              ))}
            </div>
          </div>
          <div style={styles.leftFooter}>© {new Date().getFullYear()} CollabAI</div>
        </div>

        {/* Right panel */}
        <div style={styles.right}>
          <div style={styles.formWrap}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>{isLogin ? "Log In" : "Create Account"}</h2>
              <p style={styles.formSub}>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button style={styles.switchBtn} onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? " Register" : " Log in"}
                </button>
              </p>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              {!isLogin && (
                <div style={styles.field}>
                  <label style={styles.label}>Full Name</label>
                  <input
                    style={styles.input}
                    type="text"
                    name="username"
                    placeholder="Your full name"
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input
                  style={styles.input}
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  onChange={handleChange}
                  required
                />
              </div>

              {isLogin && (
                <div style={styles.forgotRow}>
                  <button type="button" style={styles.forgotBtn}>Forgot password?</button>
                </div>
              )}

              <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Log In →" : "Create Account →"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh", background: "#171e1b",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif", padding: "1.5rem", boxSizing: "border-box",
  },
  card: {
    width: "100%", maxWidth: "860px", minHeight: "520px",
    display: "flex", borderRadius: "20px", overflow: "hidden",
    border: "1px solid #3a5045",
    boxShadow: "0 0 80px rgba(62,128,100,0.1)",
  },
  left: {
    width: "45%", background: "#1f2b25",
    display: "flex", flexDirection: "column",
    padding: "2.5rem", justifyContent: "space-between",
    borderRight: "1px solid #3a5045", flexShrink: 0,
  },
  logo: { fontSize: "16px", fontWeight: "700", color: "#7ec8a4", letterSpacing: "-0.02em" },
  leftBody: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  leftTitle: {
    fontSize: "28px", fontWeight: "700", color: "#e4ede8",
    lineHeight: 1.2, letterSpacing: "-0.02em",
  },
  leftDesc: { fontSize: "14px", color: "#7a9688", lineHeight: 1.8 },
  tagRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "0.25rem" },
  tag: {
    fontSize: "11px", color: "#7ec8a4", fontWeight: "600",
    background: "#283830", border: "1px solid #3a5045",
    borderRadius: "20px", padding: "4px 12px", letterSpacing: "0.04em",
  },
  leftFooter: { fontSize: "11px", color: "#4a6358" },
  right: {
    flex: 1, background: "#171e1b",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "2.5rem",
  },
  formWrap: { width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column", gap: "2rem" },
  formHeader: { display: "flex", flexDirection: "column", gap: "6px" },
  formTitle: { fontSize: "22px", fontWeight: "700", color: "#e4ede8", letterSpacing: "-0.02em" },
  formSub: { fontSize: "13px", color: "#7a9688" },
  switchBtn: {
    background: "none", border: "none", color: "#7ec8a4",
    cursor: "pointer", fontSize: "13px", fontWeight: "600",
    fontFamily: "'DM Sans', sans-serif", padding: "0",
  },
  form: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: {
    fontSize: "11px", color: "#7a9688", fontWeight: "600",
    letterSpacing: "0.06em", textTransform: "uppercase",
  },
  input: {
    background: "#1f2b25", border: "1px solid #3a5045",
    borderRadius: "10px", padding: "11px 14px",
    color: "#e4ede8", fontSize: "14px", outline: "none",
    fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s",
  },
  forgotRow: { display: "flex", justifyContent: "flex-end" },
  forgotBtn: {
    background: "none", border: "none", color: "#4a6358",
    fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  submitBtn: {
    background: "#7ec8a4", border: "none", color: "#171e1b",
    borderRadius: "10px", padding: "13px", cursor: "pointer",
    fontSize: "14px", fontWeight: "700", fontFamily: "'DM Sans', sans-serif",
    transition: "opacity 0.15s", marginTop: "0.25rem",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input:focus { border-color: #7ec8a4 !important; }
  input::placeholder { color: #4a6358; }
  button:hover { opacity: 0.85; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  @media (max-width: 600px) {
    div[style*="maxWidth: 860px"] { flex-direction: column; min-height: unset; }
    div[style*="width: 45%"] { width: 100% !important; padding: 1.5rem !important; }
  }
`;
