import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import emojiIcon from "../assets/emoji-icon.png";
import API_BASE_URL from "../config/api";


const socket = io(API_BASE_URL);

const EMOJIS = ["😊", "😂", "🔥", "👍", "❤️", "🎉", "😎", "🤔", "👏", "💯", "🚀", "✨", "😅", "🙏", "💪", "👀", "😍", "🤝", "⚡", "🎯"];

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const aiBottomRef = useRef(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  const getInitials = (name = "") =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const getAvatarColor = (name = "") => {
    const colors = ["#7ec8a4", "#5aaa84", "#ec4899", "#14b8a6", "#f59e0b", "#10b981", "#3b82f6", "#f43f5e"];
    let hash = 0;
    for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    socket.emit("join_room", { roomId, user });

    fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((data) => setRoomInfo(data));

    socket.on("room_history", (history) => {
      setMessages(history.map((m) => ({ text: m.text, user: m.user, timestamp: m.createdAt })));
    });

    socket.on("receive_message", (payload) => {
      setMessages((prev) => [...prev, payload]);
    });

    socket.on("user_joined", ({ user: u }) => {
      setMessages((prev) => [...prev, { system: true, text: `${u?.name} joined` }]);
      setParticipants((prev) => [...prev.filter((p) => p.id !== u?.id), u]);
    });

    socket.on("user_left", ({ user: u }) => {
      setMessages((prev) => [...prev, { system: true, text: `${u?.name} left` }]);
      setParticipants((prev) => prev.filter((p) => p.id !== u?.id));
    });

    socket.on("meeting_ended", () => {
      alert("Meeting has ended");
      navigate("/dashboard");
    });

    socket.on("typing", ({ user: u, isTyping }) => {
      setTypingUsers((prev) =>
        isTyping ? [...prev.filter((n) => n !== u?.name), u?.name] : prev.filter((n) => n !== u?.name)
      );
    });

    const handleVisibility = () => {
      socket.emit("user_status_change", {
        roomId,
        status: document.visibilityState === "visible" ? "active" : "idle",
      });
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      socket.off("room_history");
      socket.off("receive_message");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("meeting_ended");
      socket.off("typing");
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = (e) => {
    setInput(e.target.value);
    socket.emit("typing", { roomId, user, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing", { roomId, user, isTyping: false });
    }, 1500);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("send_message", { roomId, message: input, user });
    socket.emit("typing", { roomId, user, isTyping: false });
    setInput("");
    setAiSuggestions([]);
    setShowEmoji(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.fileUrl) {
        // Send as message via socket
        socket.emit("send_message", {
          roomId,
          message: "",
          user,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          messageType: data.messageType,
        });
      }
    } catch {
      toast.error("File upload failed");
    }

    setUploading(false);
    // Reset file input so same file can be uploaded again
    e.target.value = "";
  };

  const askAI = async () => {
    if (!aiInput.trim()) return;

    const question = aiInput.trim();
    setAiInput("");
    setAiMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoadingAI(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/ask`,  {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          question,
          roomMessages: messages,
        }),
      });
      const data = await res.json();
      setAiMessages((prev) => [...prev, { role: "ai", text: data.answer || "No response." }]);
    } catch {
      setAiMessages((prev) => [...prev, { role: "ai", text: "Something went wrong. Try again." }]);
    }
    setLoadingAI(false);
  };

  const endMeeting = async () => {
    if (!window.confirm("End meeting for everyone?")) return;
    await fetch(`${API_BASE_URL}/api/rooms/${roomId}/end`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  };

  return (
    <div style={styles.root}>
      <style>{css}</style>

      {/* Left Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logo}> CollabAI</div>
          <div style={styles.roomBadge}>
            <span style={styles.roomLabel}>ROOM</span>
            <span style={styles.roomId}>{roomId}</span>
            <button
              style={styles.copyBtn}
              onClick={() => navigator.clipboard.writeText(roomId)}
              title="Copy room ID"
            >
              ⎘
            </button>
          </div>
          {roomInfo && (
            <div style={styles.roomTitle}>{roomInfo.title}</div>
          )}
        </div>

        <div style={styles.participantsSection}>
          <div style={styles.sectionLabel}>PARTICIPANTS</div>
          {user && (
            <div style={styles.participantRow}>
              <div style={{ ...styles.avatar, background: getAvatarColor(user.name) }}>
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  : getInitials(user?.name)
                }
              </div>
              <div>
                <div style={styles.participantName}>{user.name} <span style={styles.youTag}>you</span></div>
                <div style={styles.statusDot}>
                  <span style={{ ...styles.dot, background: "#7ec8a4" }} />
                  <span style={styles.statusText}>Active</span>
                </div>
              </div>
            </div>
          )}
          {participants.filter((p) => p?.id !== user?.id).map((p, i) => (
            <div key={i} style={styles.participantRow}>
              <div style={{ ...styles.avatar, background: getAvatarColor(p?.name) }}>
                {getInitials(p?.name)}
              </div>
              <div>
                <div style={styles.participantName}>{p?.name}</div>
                <div style={styles.statusDot}>
                  <span style={{ ...styles.dot, background: "#7ec8a4" }} />
                  <span style={styles.statusText}>Active</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button style={styles.endBtn} onClick={endMeeting}>
          End Meeting
        </button>
      </aside>
      {/* ── Main area: Chat + AI Panel ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Chat ── */}
        <main style={styles.main}>

          {/* Header */}
          <div style={styles.header}>
            <div>
              <div style={styles.headerTitle}>{roomInfo?.title || "Meeting Room"}</div>
              <div style={styles.headerSub}>{roomInfo?.description || `Room · ${roomId}`}</div>
            </div>
            <div style={styles.headerRight}>
              <div style={styles.liveIndicator}>
                <span style={styles.liveDot} className="pulse" />
                LIVE
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>💬</div>
                <div style={styles.emptyText}>No messages yet. Start the conversation!</div>
              </div>
            )}
            {messages.map((msg, i) =>
              msg.system ? (
                <div key={i} style={styles.systemMsg}>{msg.text}</div>
              ) : (
                <div
                  key={i}
                  style={{
                    ...styles.messageRow,
                    flexDirection: msg.user?.id === user?.id ? "row-reverse" : "row",
                  }}
                >
                  <div style={{ ...styles.avatar, background: getAvatarColor(msg.user?.name), flexShrink: 0 }}>
                    {getInitials(msg.user?.name)}
                  </div>
                  <div style={{ maxWidth: "60%", display: "flex", flexDirection: "column", alignItems: msg.user?.id === user?.id ? "flex-end" : "flex-start" }}>
                    <div style={styles.messageMeta}>
                      <span style={styles.messageAuthor}>{msg.user?.name}</span>
                      <span style={styles.messageTime}>{formatTime(msg.timestamp)}</span>
                    </div>
                    <div
                      style={{
                        ...styles.bubble,
                        background: msg.user?.id === user?.id ? "linear-gradient(135deg, #7ec8a4, #5aaa84)" : "#283830",
                        borderRadius: msg.user?.id === user?.id ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        padding: msg.messageType && msg.messageType !== "text" ? "8px" : "10px 14px",
                      }}
                    >
                      {/* Text message */}
                      {(!msg.messageType || msg.messageType === "text") && msg.text}

                      {/* Image message */}
                      {msg.messageType === "image" && (
                        <img
                          src={msg.fileUrl}
                          alt="shared image"
                          style={{
                            maxWidth: "220px",
                            maxHeight: "200px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            display: "block",
                          }}
                          onClick={() => window.open(msg.fileUrl, "_blank")}
                          onError={() => toast.error("Failed to load image")}
                        />
                      )}

                      {/* PDF message */}
                      {msg.messageType === "pdf" && (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: "10px",
                            padding: "10px 14px",
                            textDecoration: "none",
                            color: "#e4ede8",
                            minWidth: "180px",
                          }}
                        >
                          <span style={{ fontSize: "24px" }}>📄</span>
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "2px" }}>
                              {msg.fileName || "Document"}
                            </div>
                            <div style={{ fontSize: "10px", color: "#888" }}>
                              Click to open PDF
                            </div>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {typingUsers.length > 0 && (
              <div style={styles.typingIndicator}>
                <div style={styles.typingDots}>
                  <span className="typingDot" />
                  <span className="typingDot" />
                  <span className="typingDot" />
                </div>
                <span style={styles.typingText}>
                  {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Emoji Picker */}
          {showEmoji && (
            <div style={styles.emojiPicker}>
              {EMOJIS.map((e, i) => (
                <button
                  key={i}
                  style={styles.emojiBtn}
                  onClick={() => {
                    setInput((prev) => prev + e);
                    setShowEmoji(false);
                    inputRef.current?.focus();
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div style={styles.inputArea}>
            <button
              style={styles.iconBtn}
              onClick={() => setShowEmoji((prev) => !prev)}
              title="Emoji"
            >
              <img src={emojiIcon} alt="Emoji" style={{ width: "20px", height: "20px" }} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />

            {/* Upload button for image and pdf files*/}
            <button
              style={styles.iconBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Upload image or PDF"
            >
              {uploading ? "..." : "📎"}
            </button>

            <input
              ref={inputRef}
              value={input}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              style={styles.input}
            />

            <button
              style={{ ...styles.iconBtn, fontSize: "13px", color: aiOpen ? "#7ec8a4" : "#888", letterSpacing: "0.05em" }}
              onClick={() => setAiOpen((prev) => !prev)}
              title="Ask AI"
            >
              ✦ AI
            </button>

            <button style={styles.sendBtn} onClick={sendMessage}>
              Send ↑
            </button>
          </div>

        </main>

        {/* ── AI Side Panel ── */}
        {aiOpen && (
          <div style={styles.aiPanel}>
            <div style={styles.aiPanelHeader}>
              <span style={styles.aiPanelTitle}>✦ Ask AI</span>
              <button style={styles.aiCloseBtn} onClick={() => setAiOpen(false)}>
                ✕
              </button>
            </div>

            {/* AI Chat Messages */}
            <div style={styles.aiPanelBody}>
              {aiMessages.length === 0 && (
                <div style={styles.aiEmptyState}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>✦</div>
                  <div style={{ fontSize: "12px", color: "#555", textAlign: "center", lineHeight: 1.5 }}>
                    Ask me anything about this meeting
                  </div>
                  <div style={styles.aiExamples}>
                    {["Summarise the chat", "What was decided?", "Key points so far"].map((ex, i) => (
                      <button
                        key={i}
                        style={styles.aiExampleChip}
                        onClick={() => setAiInput(ex)}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {aiMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.aiMessage,
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    background: msg.role === "user" ? "#1e1e3a" : "#1f2b25",
                    borderColor: msg.role === "user" ? "#3a5045" : "#3a5045",
                  }}
                >
                  <div style={{ fontSize: "9px", color: msg.role === "user" ? "#7ec8a4" : "#7ec8a4", marginBottom: "4px", fontWeight: "700" }}>
                    {msg.role === "user" ? "YOU" : "✦ GEMINI"}
                  </div>
                  {msg.text}
                </div>
              ))}

              {loadingAI && (
                <div style={{ ...styles.aiMessage, alignSelf: "flex-start", background: "#1f2b25" }}>
                  <div style={{ fontSize: "9px", color: "#7ec8a4", marginBottom: "6px", fontWeight: "700" }}>✦ GEMINI</div>
                  <div style={styles.aiLoading}>
                    <span className="typingDot" />
                    <span className="typingDot" />
                    <span className="typingDot" />
                  </div>
                </div>
              )}
              <div ref={aiBottomRef} />
            </div>

            {/* AI Input */}
            <div style={styles.aiInputArea}>
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askAI()}
                placeholder="Ask about this meeting..."
                style={styles.aiInput}
              />
              <button style={styles.aiSendBtn} onClick={askAI} disabled={loadingAI}>
                ↑
              </button>
            </div>

            <div style={styles.aiPanelFooter}>Powered by Gemini</div>
          </div>
        )}
      </div>
    </div>
  );
}


const styles = {
  root: {
    display: "flex",
    height: "100vh",
    background: "#171e1b",
    fontFamily: "'DM Sans', sans-serif",
    color: "#e4ede8",
    overflow: "hidden",
  },
  sidebar: {
    width: "240px",
    background: "#1f2b25",
    borderRight: "1px solid #3a5045",
    display: "flex",
    flexDirection: "column",
    padding: "1.25rem",
    gap: "1.5rem",
    flexShrink: 0,
  },
  sidebarTop: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  logo: { fontSize: "16px", fontWeight: "700", color: "#b8dece", letterSpacing: "-0.02em" },
  roomBadge: {
    display: "flex", alignItems: "center", gap: "6px",
    background: "#283830", borderRadius: "8px", padding: "6px 10px",
    border: "1px solid #3a5045",
  },
  roomLabel: { fontSize: "9px", color: "#7ec8a4", fontWeight: "700", letterSpacing: "0.1em" },
  roomId: { fontSize: "13px", fontWeight: "600", color: "#b8dece", flex: 1 },
  copyBtn: {
    background: "none", border: "none", color: "#7ec8a4", cursor: "pointer",
    fontSize: "16px", padding: "0", lineHeight: 1,
  },
  roomTitle: { fontSize: "13px", color: "#888", lineHeight: 1.4 },
  participantsSection: { flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" },
  sectionLabel: { fontSize: "10px", color: "#555", fontWeight: "700", letterSpacing: "0.1em" },
  participantRow: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: {
    width: "34px", height: "34px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "12px", fontWeight: "700", color: "#fff", flexShrink: 0,
  },
  participantName: { fontSize: "13px", fontWeight: "500", color: "#d4d4e8" },
  youTag: {
    fontSize: "9px", background: "#1e1e3a", color: "#7ec8a4",
    padding: "1px 5px", borderRadius: "4px", marginLeft: "4px",
  },
  statusDot: { display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" },
  dot: { width: "6px", height: "6px", borderRadius: "50%", display: "inline-block" },
  statusText: { fontSize: "11px", color: "#555" },
  endBtn: {
    background: "none", border: "1px solid #3f1f1f", color: "#f87171",
    borderRadius: "8px", padding: "8px", cursor: "pointer",
    fontSize: "13px", fontWeight: "500", transition: "all 0.2s",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "1rem 1.5rem", borderBottom: "1px solid #3a5045",
    background: "#1f2b25",
  },
  headerTitle: { fontSize: "15px", fontWeight: "600", color: "#e4ede8" },
  headerSub: { fontSize: "12px", color: "#555", marginTop: "2px" },
  headerRight: { display: "flex", alignItems: "center", gap: "12px" },
  liveIndicator: {
    display: "flex", alignItems: "center", gap: "6px",
    fontSize: "10px", fontWeight: "700", color: "#7ec8a4", letterSpacing: "0.1em",
  },
  liveDot: {
    width: "7px", height: "7px", borderRadius: "50%",
    background: "#7ec8a4", display: "inline-block",
  },
  main: {
    flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
  },
  messages: {
    flex: 1, overflowY: "auto", padding: "1.5rem",
    display: "flex", flexDirection: "column", gap: "1rem",
  },
  emptyState: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: "0.75rem", marginTop: "4rem",
  },
  emptyIcon: { fontSize: "40px" },
  emptyText: { color: "#444", fontSize: "14px" },
  systemMsg: {
    textAlign: "center", color: "#444", fontSize: "12px",
    padding: "4px 12px", background: "#1f2b25",
    borderRadius: "20px", alignSelf: "center",
  },
  messageRow: { display: "flex", gap: "10px", alignItems: "flex-end" },
  messageMeta: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" },
  messageAuthor: { fontSize: "12px", color: "#666", fontWeight: "500" },
  messageTime: { fontSize: "10px", color: "#444" },
  bubble: {
    padding: "10px 14px", fontSize: "14px", lineHeight: "1.5",
    color: "#e4ede8", wordBreak: "break-word",
  },
  typingIndicator: {
    display: "flex", alignItems: "center", gap: "8px", padding: "4px 0",
  },
  typingDots: { display: "flex", gap: "3px", alignItems: "center" },
  typingText: { fontSize: "12px", color: "#555" },
  suggestions: {
    display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
    padding: "0.75rem 1.5rem", borderTop: "1px solid #283830",
    background: "#1f2b25",
  },
  suggestLabel: { fontSize: "11px", color: "#7ec8a4", fontWeight: "600" },
  suggestionChip: {
    background: "#283830", border: "1px solid #3a5045", color: "#b8dece",
    borderRadius: "20px", padding: "5px 12px", fontSize: "12px",
    cursor: "pointer", transition: "all 0.15s",
  },
  emojiPicker: {
    display: "flex", flexWrap: "wrap", gap: "4px",
    padding: "0.75rem 1.5rem", borderTop: "1px solid #283830",
    background: "#1f2b25",
  },
  emojiBtn: {
    background: "none", border: "none", fontSize: "20px",
    cursor: "pointer", padding: "4px", borderRadius: "6px",
    transition: "background 0.1s",
  },
  inputArea: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "1rem 1.5rem", borderTop: "1px solid #3a5045",
    background: "#1f2b25",
  },
  iconBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: "18px", padding: "6px", borderRadius: "8px",
    color: "#888", transition: "all 0.15s",
  },
  input: {
    flex: 1, background: "#283830", border: "1px solid #3a5045",
    borderRadius: "12px", padding: "10px 16px", color: "#e4ede8",
    fontSize: "14px", outline: "none",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #7ec8a4, #5aaa84)",
    border: "none", color: "#fff", borderRadius: "10px",
    padding: "10px 18px", cursor: "pointer", fontSize: "13px",
    fontWeight: "600", letterSpacing: "0.02em", transition: "opacity 0.15s",
  },
  aiPanel: {
    width: "220px",
    background: "#1f2b25",
    borderLeft: "1px solid #3a5045",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    animation: "slideIn 0.2s ease",
  },
  aiPanelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem",
    borderBottom: "1px solid #3a5045",
  },
  aiPanelTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#7ec8a4",
    letterSpacing: "0.08em",
  },
  aiCloseBtn: {
    background: "none",
    border: "none",
    color: "#555",
    cursor: "pointer",
    fontSize: "12px",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  aiPanelBody: {
    flex: 1,
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    overflowY: "auto",
  },
  aiChip: {
    background: "#283830",
    border: "1px solid #3a5045",
    color: "#b8dece",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "left",
    lineHeight: "1.5",
    display: "flex",
    gap: "8px",
    alignItems: "flex-start",
    transition: "border-color 0.15s",
  },
  aiChipNumber: {
    fontSize: "10px",
    color: "#7ec8a4",
    fontWeight: "700",
    background: "#1e1e3a",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "2px",
  },
  aiLoading: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  aiPanelFooter: {
    padding: "0.75rem 1rem",
    fontSize: "10px",
    color: "#333",
    borderTop: "1px solid #283830",
    textAlign: "center",
    letterSpacing: "0.05em",
  },
  aiEmptyState: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "1.5rem 0.5rem", gap: "0.5rem",
  },
  aiExamples: {
    display: "flex", flexDirection: "column",
    gap: "6px", marginTop: "12px", width: "100%",
  },
  aiExampleChip: {
    background: "#283830", border: "1px solid #3a5045",
    color: "#666", borderRadius: "8px", padding: "6px 10px",
    fontSize: "11px", cursor: "pointer", textAlign: "left",
    transition: "all 0.15s",
  },
  aiMessage: {
    border: "1px solid", borderRadius: "12px",
    padding: "8px 12px", fontSize: "12px",
    color: "#b8dece", lineHeight: "1.5",
    maxWidth: "90%", wordBreak: "break-word",
  },
  aiInputArea: {
    display: "flex", gap: "6px",
    padding: "0.75rem", borderTop: "1px solid #3a5045",
  },
  aiInput: {
    flex: 1, background: "#283830", border: "1px solid #3a5045",
    borderRadius: "8px", padding: "8px 10px", color: "#e4ede8",
    fontSize: "12px", outline: "none",
  },
  aiSendBtn: {
    background: "linear-gradient(135deg, #7ec8a4, #5aaa84)",
    border: "none", color: "#fff", borderRadius: "8px",
    padding: "8px 12px", cursor: "pointer", fontSize: "13px",
    fontWeight: "700",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #3a5045; border-radius: 4px; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  .pulse { animation: pulse 1.5s ease-in-out infinite; }
  @keyframes typingBounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
  .typingDot {
    width: 5px; height: 5px; border-radius: 50%; background: #555;
    display: inline-block; animation: typingBounce 1.2s ease-in-out infinite;
  }
  .typingDot:nth-child(2) { animation-delay: 0.2s; }
  .typingDot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;

