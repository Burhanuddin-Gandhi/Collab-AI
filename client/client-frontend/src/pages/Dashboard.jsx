import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import API_BASE_URL from "../config/api";

export default function Dashboard() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [joinId, setJoinId] = useState("");
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(false);
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const getInitials = (name = "") =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/rooms/history", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        setRecentMeetings(data.slice(0, 2));
      } catch { /* silently fail */ }
    };
    fetchRecent();
  }, []);

  const createRoom = async () => {
    if (!title.trim()) return toast.error("Enter a room title");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (data.roomId) { toast.success("Room created!"); navigate(`/room/${data.roomId}`); }
      else toast.error("Failed to create room");
    } catch { toast.error("Server error."); }
    setLoading(false);
  };

  const joinRoom = () => {
    if (!joinId.trim()) return toast.error("Enter a room ID");
    if (joinId.trim().length !== 6) return toast.error("Room ID must be 6 characters");
    navigate(`/room/${joinId.toUpperCase()}`);
  };

  const downloadSummary = async (roomId, title) => {
    setDownloading(roomId);
    try {
      const res = await fetch(`http://localhost:5000/api/rooms/${roomId}/summary/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) { toast.error("Failed to download"); setDownloading(null); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `summary-${title.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } catch { toast.error("Download failed."); }
    setDownloading(null);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const formatDuration = (m) => {
    if (!m) return "< 1 min";
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ""}`.trim();
  };

  return (
    <div style={styles.root}>
      <style>{css}</style>
      <Navbar />

      <div style={styles.content}>

        {/* Greeting */}
        <div style={styles.greeting}>
          <div style={styles.greetLeft}>
            <div style={{ ...styles.greetAvatar, background: user?.avatarColor || "#5aaa84" }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                : getInitials(user?.name)
              }
            </div>
            <div>
              <div style={styles.greetText}>{getGreeting()}, <span style={styles.greetName}>{user?.name?.split(" ")[0]}.</span></div>
              <div style={styles.greetSub}>Ready to start a meeting?</div>
            </div>
          </div>
          <button style={styles.historyBtn} onClick={() => navigate("/history")}>
            View All Meetings →
          </button>
        </div>

        {/* Create / Join Card */}
        <div style={styles.roomSection}>

          {/* Left — Create tab */}
          <div style={styles.roomHalf}>
            <div style={styles.roomHalfTop}>
              <div style={styles.roomHalfLabel}>START A MEETING</div>
              <div style={styles.roomHalfTitle}>Create a new room</div>
              <div style={styles.roomHalfSub}>Get a shareable room ID instantly and invite your team.</div>
            </div>
            <div style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Room Title</label>
                <input
                  style={styles.input}
                  placeholder="e.g. Sprint Planning Q2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createRoom()}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Description <span style={styles.optional}>(optional)</span></label>
                <input
                  style={styles.input}
                  placeholder="What's this meeting about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <button style={styles.createBtn} onClick={createRoom} disabled={loading}>
                {loading ? "Creating..." : "⚡  Create Room"}
              </button>
            </div>
          </div>

          {/* Vertical divider */}
          <div style={styles.vDivider}>
            <div style={styles.vLine} />
            <div style={styles.orBadge}>OR</div>
            <div style={styles.vLine} />
          </div>

          {/* Join side */}
          <div style={styles.roomHalf}>
            <div style={styles.roomHalfTop}>
              <div style={styles.roomHalfLabel}>JOIN A MEETING</div>
              <div style={styles.roomHalfTitle}>Enter a room ID</div>
              <div style={styles.roomHalfSub}>Paste the 6-character ID shared by the host.</div>
            </div>
            <div style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Room ID</label>
                <input
                  style={styles.joinInput}
                  placeholder="AB12CD"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                  maxLength={6}
                />
              </div>
              <button style={styles.joinBtn} onClick={joinRoom}>
                🔗  Join Room
              </button>
            </div>
          </div>
        </div>

        {/* Recent Meetings */}
        {recentMeetings.length > 0 && (
          <div style={styles.recentSection}>
            <div style={styles.recentHeader}>
              <div style={styles.recentTitle}>Recent Meetings</div>
              <button style={styles.seeAllBtn} onClick={() => navigate("/history")}>See all →</button>
            </div>

            <div style={styles.recentList}>
              {recentMeetings.map((m) => (
                <div key={m._id} style={styles.recentCard} className="recent-card">
                  <div style={styles.recentLeft}>
                    <div style={styles.recentMeetTitle}>{m.title}</div>
                    {m.description && <div style={styles.recentDesc}>{m.description}</div>}
                    <div style={styles.recentMeta}>
                      <span> {formatDate(m.endedAt)}</span>
                      <span> {formatDuration(m.duration)}</span>
                      <span> {m.participants?.length || 1} participant{m.participants?.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  {m.summary && (
                    <button
                      style={styles.downloadBtn}
                      onClick={() => downloadSummary(m.roomId, m.title)}
                      disabled={downloading === m.roomId}
                    >
                      {downloading === m.roomId ? "..." : "Summary"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerBottom}>
          <span style={styles.footerCopy}>© {new Date().getFullYear()} CollabAI. All rights reserved.</span>
          <span style={styles.footerBuilt}>Built by Burhanuddin Gandhi</span>
        </div>
      </footer>

    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh", background: "#171e1b",
    fontFamily: "'DM Sans', sans-serif", color: "#e4ede8",
    display: "flex", flexDirection: "column",
  },
  content: { flex: 1, maxWidth: "860px", margin: "0 auto", padding: "2rem 2rem 3rem", width: "100%", boxSizing: "border-box" },

  // Greeting
  greeting: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem",
  },
  greetLeft: { display: "flex", alignItems: "center", gap: "14px" },
  greetAvatar: {
    width: "46px", height: "46px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "16px", fontWeight: "700", color: "#fff", flexShrink: 0,
  },
  greetText: { fontSize: "20px", fontWeight: "700", color: "#e4ede8", letterSpacing: "-0.02em" },
  greetName: { color: "#b8dece" },
  greetSub: { fontSize: "13px", color: "#555", marginTop: "2px" },
  historyBtn: {
    background: "none", border: "1px solid #3a5045", color: "#666",
    borderRadius: "8px", padding: "8px 16px", cursor: "pointer",
    fontSize: "13px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
  },

  // Room section
 
  roomCard: {
    flex: 1, background: "#1f2b25", border: "1px solid #3a5045",
    borderRadius: "16px", padding: "1.75rem",
    display: "flex", flexDirection: "column", gap: "1.25rem",
  },
  roomCardHeader: { display: "flex", alignItems: "center", gap: "12px" },
  roomCardIcon: {
    width: "36px", height: "36px", borderRadius: "10px",
    background: "#283830", border: "1px solid #3a5045",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "16px", flexShrink: 0,
  },
  roomCardTitle: { fontSize: "15px", fontWeight: "600", color: "#e4ede8" },
  roomCardSub: { fontSize: "12px", color: "#555", marginTop: "2px" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "11px", color: "#555", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase" },
  optional: { color: "#333", fontWeight: "400", textTransform: "none" },
  input: {
    background: "#171e1b", border: "1px solid #3a5045",
    borderRadius: "10px", padding: "11px 14px",
    color: "#e4ede8", fontSize: "14px", outline: "none",
    fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s",
  },
  primaryBtn: {
    background: "#7ec8a4", border: "none", color: "#fff",
    borderRadius: "10px", padding: "12px", cursor: "pointer",
    fontSize: "14px", fontWeight: "600", fontFamily: "'DM Sans', sans-serif",
    transition: "opacity 0.15s", marginTop: "0.25rem",
  },
  joinHint: { fontSize: "11px", color: "#444", textAlign: "center" },

  // OR divider
  orDivider: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "0 1.25rem", gap: "8px",
  },
  orLine: { width: "1px", flex: 1, background: "#3a5045" },
  orText: { fontSize: "11px", color: "#333", fontWeight: "600", letterSpacing: "0.1em" },
  roomSection: {
  display: "flex", alignItems: "stretch",
  marginBottom: "2.5rem",
  border: "1px solid #3a5045",
  borderRadius: "14px", overflow: "hidden",
},
roomHalf: {
  flex: 1, padding: "2rem",
  display: "flex", flexDirection: "column", gap: "1.5rem",
},
roomHalfTop: { display: "flex", flexDirection: "column", gap: "6px" },
roomHalfLabel: {
  fontSize: "10px", color: "#7ec8a4", fontWeight: "700",
  letterSpacing: "0.1em",
},
roomHalfTitle: { fontSize: "17px", fontWeight: "700", color: "#e4ede8" },
roomHalfSub: { fontSize: "13px", color: "#7a9688", lineHeight: 1.6 },
vDivider: {
  display: "flex", flexDirection: "column", alignItems: "center",
  padding: "1.5rem 0", gap: "8px",
  borderLeft: "1px solid #3a5045", borderRight: "1px solid #3a5045",
  width: "48px", flexShrink: 0,
},
vLine: { flex: 1, width: "1px", background: "#3a5045" },
orBadge: {
  fontSize: "10px", color: "#7a9688", fontWeight: "700",
  letterSpacing: "0.1em", writingMode: "vertical-rl",
},
createBtn: {
  background: "#7ec8a4", border: "none", color: "#171e1b",
  borderRadius: "8px", padding: "12px", cursor: "pointer",
  fontSize: "14px", fontWeight: "700", fontFamily: "'DM Sans', sans-serif",
  transition: "opacity 0.15s", marginTop: "auto",
},
joinBtn: {
  background: "#283830", border: "1px solid #3a5045", color: "#e4ede8",
  borderRadius: "8px", padding: "12px", cursor: "pointer",
  fontSize: "14px", fontWeight: "600", fontFamily: "'DM Sans', sans-serif",
  transition: "all 0.15s", marginTop: "auto",
},
joinInput: {
  background: "#171e1b", border: "1px solid #3a5045",
  borderRadius: "10px", padding: "14px",
  color: "#e4ede8", fontSize: "22px", outline: "none",
  fontFamily: "'DM Mono', monospace",
  textTransform: "uppercase", letterSpacing: "0.2em",
  textAlign: "center", transition: "border-color 0.2s",
},  
  // Recent
  recentSection: { marginBottom: "2rem" },
  recentHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" },
  recentTitle: { fontSize: "14px", fontWeight: "600", color: "#888", letterSpacing: "0.02em" },
  seeAllBtn: {
    background: "none", border: "none", color: "#7ec8a4", cursor: "pointer",
    fontSize: "12px", fontFamily: "'DM Sans', sans-serif", padding: "0",
  },
  recentList: { display: "flex", flexDirection: "column", gap: "10px" },
  recentCard: {
    background: "#1f2b25", border: "1px solid #3a5045",
    borderRadius: "12px", padding: "1rem 1.25rem",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: "1rem", transition: "border-color 0.2s",
  },
  recentLeft: { display: "flex", flexDirection: "column", gap: "5px", flex: 1 },
  recentMeetTitle: { fontSize: "14px", fontWeight: "600", color: "#e4ede8" },
  recentDesc: { fontSize: "14px", color: "#555" },
  recentMeta: { display: "flex", gap: "12px", fontSize: "11px", color: "#444", flexWrap: "wrap" },
  downloadBtn: {
    background: "#1f2b25", border: "1px solid #3a5045", color: "#b8dece",
    borderRadius: "8px", padding: "7px 14px", cursor: "pointer",
    fontSize: "12px", fontWeight: "500", fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
  },

  // Footer
  footer: { background: "#171e1b", borderTop: "1px solid #3a5045" },
  footerBottom: {
    maxWidth: "860px", margin: "0 auto", padding: "1.25rem 2rem",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    boxSizing: "border-box",
  },
  footerCopy: { fontSize: "11px", color: "#444" },
  footerBuilt: { fontSize: "11px", color: "#444" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input:focus { border-color: #7ec8a4 !important; }
  input::placeholder { color: #333; }
  button:hover { opacity: 0.85; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .recent-card:hover { border-color: #3a5045 !important; }
`;
