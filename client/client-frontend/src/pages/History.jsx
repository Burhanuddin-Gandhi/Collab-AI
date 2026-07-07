import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import API_BASE_URL from "../config/api";

export default function History() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null); // roomId of meeting being downloaded

  useEffect(() => {
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/history`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setMeetings(data);
    } catch {
      toast.error("Failed to load meeting history");
    }
    setLoading(false);
  };
  fetchHistory();
}, []);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "< 1 min";
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const downloadSummary = async (roomId, title) => {
    setDownloading(roomId);
    try {
      const res = await fetch(
        `http://localhost:5000/api/rooms/${roomId}/summary/download`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to download summary");
        setDownloading(null);
        return;
      }

      // Stream PDF as download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `summary-${title.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Summary downloaded!");
    } catch {
      toast.error("Download failed. Please try again.");
    }
    setDownloading(null);
  };

  return (
    <div style={styles.root}>
      <style>{css}</style>
      <Navbar />

      <div style={styles.content}>

        {/* Page header */}
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Meeting History</h1>
          <p style={styles.pageSubtitle}>
            All your past meetings with AI-generated summaries.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⏳</div>
            <div style={styles.emptyText}>Loading your meetings...</div>
          </div>
        )}

        {/* Empty state */}
        {!loading && meetings.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <div style={styles.emptyText}>No meetings yet.</div>
            <div style={styles.emptySubtext}>
              Create a room and start collaborating to see your history here.
            </div>
          </div>
        )}

        {/* Meeting cards */}
        {!loading && meetings.length > 0 && (
          <div style={styles.list}>
            {meetings.map((meeting) => (
              <div key={meeting._id} style={styles.card}>

                {/* Left — meeting details */}
                <div style={styles.cardLeft}>
                  <div style={styles.cardHeader}>
                    <div style={styles.meetingTitle}>{meeting.title}</div>
                    <div style={styles.meetingStatus}>Ended</div>
                  </div>

                  {meeting.description && (
                    <div style={styles.meetingDesc}>{meeting.description}</div>
                  )}

                  <div style={styles.metaRow}>
                    <div style={styles.metaItem}>
                      <span style={styles.metaIcon}>📅</span>
                      {formatDate(meeting.endedAt)}
                    </div>
                    <div style={styles.metaItem}>
                      <span style={styles.metaIcon}>⏱</span>
                      {formatDuration(meeting.duration)}
                    </div>
                    <div style={styles.metaItem}>
                      <span style={styles.metaIcon}>👥</span>
                      {meeting.participants?.length || 1} participant{meeting.participants?.length !== 1 ? "s" : ""}
                    </div>
                    <div style={styles.metaItem}>
                      <span style={styles.metaIcon}>👤</span>
                      Host: {meeting.owner?.name || "Unknown"}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={styles.cardDivider} />

                {/* Right — summary download */}
                <div style={styles.cardRight}>
                  <div style={styles.summaryLabel}>✦ AI Summary</div>

                  {meeting.summary ? (
                    <>
                      <div style={styles.summaryPreview}>
                        {meeting.summary.slice(0, 120)}
                        {meeting.summary.length > 120 ? "..." : ""}
                      </div>
                      <button
                        style={styles.downloadBtn}
                        onClick={() => downloadSummary(meeting.roomId, meeting.title)}
                        disabled={downloading === meeting.roomId}
                      >
                        {downloading === meeting.roomId ? (
                          "Downloading..."
                        ) : (
                          <>📄 Download PDF</>
                        )}
                      </button>
                    </>
                  ) : (
                    <div style={styles.noSummary}>
                      No summary available for this meeting.
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#171e1b",
    fontFamily: "'DM Sans', sans-serif",
    color: "#e4ede8",
  },
  content: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "2.5rem 1.5rem 4rem",
  },
  pageHeader: {
    marginBottom: "2rem",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#e4ede8",
    letterSpacing: "-0.02em",
    marginBottom: "6px",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#555",
  },
  emptyState: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "5rem 0", gap: "0.75rem",
  },
  emptyIcon: { fontSize: "40px" },
  emptyText: { fontSize: "15px", color: "#555", fontWeight: "500" },
  emptySubtext: { fontSize: "13px", color: "#444", textAlign: "center", maxWidth: "300px" },
  list: {
    display: "flex", flexDirection: "column", gap: "16px",
  },
  card: {
    background: "#1f2b25",
    border: "1px solid #3a5045",
    borderRadius: "16px",
    display: "flex",
    overflow: "hidden",
    transition: "border-color 0.2s",
  },
  cardLeft: {
    flex: 1,
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  cardHeader: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: "1rem",
  },
  meetingTitle: {
    fontSize: "15px", fontWeight: "600", color: "#e4ede8",
  },
  meetingStatus: {
    fontSize: "10px", fontWeight: "700", color: "#555",
    background: "#283830", border: "1px solid #3a5045",
    borderRadius: "20px", padding: "3px 10px",
    letterSpacing: "0.06em", textTransform: "uppercase",
    flexShrink: 0,
  },
  meetingDesc: {
    fontSize: "13px", color: "#555", lineHeight: 1.5,
  },
  metaRow: {
    display: "flex", flexWrap: "wrap", gap: "12px",
    marginTop: "0.25rem",
  },
  metaItem: {
    display: "flex", alignItems: "center", gap: "5px",
    fontSize: "12px", color: "#555",
  },
  metaIcon: { fontSize: "12px" },
  cardDivider: {
    width: "1px", background: "#3a5045", flexShrink: 0,
  },
  cardRight: {
    width: "240px",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    flexShrink: 0,
  },
  summaryLabel: {
    fontSize: "11px", fontWeight: "700", color: "#7ec8a4",
    letterSpacing: "0.06em",
  },
  summaryPreview: {
    fontSize: "12px", color: "#555", lineHeight: 1.6,
    flex: 1,
  },
  downloadBtn: {
    background: "linear-gradient(135deg, #7ec8a4, #5aaa84)",
    border: "none", color: "#fff", borderRadius: "10px",
    padding: "9px 16px", cursor: "pointer", fontSize: "12px",
    fontWeight: "600", fontFamily: "'DM Sans', sans-serif",
    transition: "opacity 0.15s", marginTop: "auto",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
  },
  noSummary: {
    fontSize: "12px", color: "#444", lineHeight: 1.5,
    fontStyle: "italic",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  button:hover { opacity: 0.85; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  div[style*="border-radius: 16px"]:hover { border-color: #3a5045 !important; }
`;
