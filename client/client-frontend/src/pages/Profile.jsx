import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import API_BASE_URL from "../config/api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "" });
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const getInitials = (name = "") =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        setUser(data);
        setForm({ name: data.name, bio: data.bio || "" });
      } catch { toast.error("Failed to load profile"); }
    };
    fetchProfile();
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.fileUrl) { toast.error("Upload failed"); setUploadingAvatar(false); return; }
      const updateRes = await fetch(`${API_BASE_URL}/api/auth/profile`,{
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ avatarUrl: uploadData.fileUrl }),
      });
      const updateData = await updateRes.json();
      const updatedUser = { ...user, ...updateData.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("Profile picture updated!");
    } catch { toast.error("Failed to upload picture"); }
    setUploadingAvatar(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name cannot be empty");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ name: form.name, bio: form.bio }),
      });
      const data = await res.json();
      const updatedUser = { ...user, ...data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditing(false);
      toast.success("Profile updated!");
    } catch { toast.error("Failed to update profile"); }
    setLoading(false);
  };

  if (!user) {
    return (
      <div style={styles.root}>
        <style>{css}</style>
        <Navbar />
        <div style={styles.loadingState}>
          <div style={styles.loadingDot} className="pulse" />
          <span style={styles.loadingText}>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <style>{css}</style>
      <Navbar />

      <div style={styles.page}>

        {/* Profile header — avatar + name + upload */}
        <div style={styles.profileHeader}>
          <div style={styles.avatarCircle}>
            {user.avatarUrl
              ? <img src={user.avatarUrl} style={styles.avatarImg} alt="profile" />
              : <span style={styles.initials}>{getInitials(user.name)}</span>
            }
          </div>
          <div style={styles.headerInfo}>
            <div style={styles.headerName}>{user.name}</div>
            <div style={styles.headerEmail}>{user.email}</div>
            <div style={styles.headerMeta}>
              Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              &nbsp;·&nbsp;
              {user.meetingsAttended || 0} meeting{user.meetingsAttended !== 1 ? "s" : ""} attended
            </div>
          </div>
          <div style={styles.headerActions}>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
            <button
              style={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? "Uploading..." : user.avatarUrl ? "📷 Change Photo" : "📷 Upload Photo"}
            </button>
            {!editing && (
              <button style={styles.editBtn} onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div style={styles.divider} />

        {/* Fields */}
        <div style={styles.sections}>

          <div style={styles.row}>
            <div style={styles.rowLabel}>Full Name</div>
            <div style={styles.rowRight}>
              {editing
                ? <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                : <div style={styles.rowValue}>{user.name}</div>
              }
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.row}>
            <div style={styles.rowLabel}>Email Address</div>
            <div style={styles.rowRight}>
              <div style={styles.rowValue}>{user.email}</div>
              <div style={styles.rowNote}>Your email address cannot be changed.</div>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.row}>
            <div style={styles.rowLabel}>Bio</div>
            <div style={styles.rowRight}>
              {editing
                ? (
                  <>
                    <textarea
                      style={styles.textarea}
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Tell your team a little about yourself..."
                      maxLength={150}
                      rows={3}
                    />
                    <div style={styles.charCount}>{form.bio.length} / 150</div>
                  </>
                )
                : <div style={{ ...styles.rowValue, color: user.bio ? "#e4ede8" : "#7a9688", fontStyle: user.bio ? "normal" : "italic" }}>
                  {user.bio || "No bio added yet."}
                </div>
              }
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.row}>
            <div style={styles.rowLabel}>Account Status</div>
            <div style={styles.rowRight}>
              <div style={styles.activeBadge}>● Active</div>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.row}>
            <div style={styles.rowLabel}>Meetings Attended</div>
            <div style={styles.rowRight}>
              <div style={styles.rowValue}>{user.meetingsAttended || 0}</div>
            </div>
          </div>

          {editing && (
            <>
              <div style={styles.divider} />
              <div style={styles.actionRow}>
                <button style={styles.saveBtn} onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button style={styles.cancelBtn} onClick={() => { setForm({ name: user.name, bio: user.bio || "" }); setEditing(false); }}>
                  Cancel
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh", background: "#171e1b",
    fontFamily: "'DM Sans', sans-serif", color: "#e4ede8",
  },
  loadingState: {
    display: "flex", alignItems: "center", justifyContent: "center",
    height: "60vh", gap: "12px",
  },
  loadingDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#7ec8a4" },
  loadingText: { fontSize: "15px", color: "#7a9688" },

  page: {
    maxWidth: "780px", margin: "0 auto",
    padding: "3rem 2rem 5rem", boxSizing: "border-box",
  },

  // Header
  profileHeader: {
    display: "flex", alignItems: "center", gap: "1.75rem",
    marginBottom: "2rem", flexWrap: "wrap",
  },
  avatarCircle: {
    width: "90px", height: "90px", borderRadius: "50%",
    background: "#5aaa84", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", border: "3px solid #3a5045",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  initials: { fontSize: "28px", fontWeight: "700", color: "#171e1b" },
  headerInfo: { flex: 1, display: "flex", flexDirection: "column", gap: "5px" },
  headerName: { fontSize: "22px", fontWeight: "700", color: "#e4ede8", letterSpacing: "-0.02em" },
  headerEmail: { fontSize: "14px", color: "#b8dece" },
  headerMeta: { fontSize: "12px", color: "#7a9688", marginTop: "2px" },
  headerActions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  uploadBtn: {
    background: "#1f2b25", border: "1px solid #3a5045",
    color: "#b8dece", borderRadius: "8px",
    padding: "9px 18px", cursor: "pointer",
    fontSize: "13px", fontWeight: "500",
    fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
  },
  editBtn: {
    background: "#7ec8a4", border: "none", color: "#171e1b",
    borderRadius: "8px", padding: "9px 20px", cursor: "pointer",
    fontSize: "13px", fontWeight: "700",
    fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.15s",
  },

  divider: { height: "1px", background: "#283830", margin: "0" },

  // Sections
  sections: { display: "flex", flexDirection: "column" },
  row: {
    display: "flex", gap: "2rem", padding: "1.5rem 0",
    alignItems: "flex-start",
  },
  rowLabel: {
    width: "180px", flexShrink: 0,
    fontSize: "14px", color: "#7a9688", fontWeight: "500",
    paddingTop: "2px",
  },
  rowRight: { flex: 1, display: "flex", flexDirection: "column", gap: "4px" },
  rowValue: { fontSize: "15px", color: "#e4ede8", lineHeight: 1.5 },
  rowNote: { fontSize: "13px", color: "#7a9688" },
  activeBadge: { fontSize: "14px", color: "#7ec8a4", fontWeight: "600" },

  input: {
    background: "#1f2b25", border: "1px solid #3a5045",
    borderRadius: "10px", padding: "11px 14px", color: "#e4ede8",
    fontSize: "15px", outline: "none", width: "100%",
    fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  textarea: {
    background: "#1f2b25", border: "1px solid #3a5045",
    borderRadius: "10px", padding: "11px 14px", color: "#e4ede8",
    fontSize: "15px", outline: "none", width: "100%",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s", resize: "none", lineHeight: 1.6,
    boxSizing: "border-box",
  },
  charCount: { fontSize: "12px", color: "#7a9688", textAlign: "right" },

  actionRow: {
    display: "flex", gap: "10px", padding: "1.5rem 0",
  },
  saveBtn: {
    background: "#7ec8a4", border: "none", color: "#171e1b",
    borderRadius: "10px", padding: "11px 24px", cursor: "pointer",
    fontSize: "14px", fontWeight: "700",
    fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.15s",
  },
  cancelBtn: {
    background: "none", border: "1px solid #3a5045", color: "#b8dece",
    borderRadius: "10px", padding: "11px 24px", cursor: "pointer",
    fontSize: "14px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input:focus, textarea:focus { border-color: #7ec8a4 !important; }
  input::placeholder, textarea::placeholder { color: #4a6358; }
  button:hover { opacity: 0.85; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  .pulse { animation: pulse 1.5s ease-in-out infinite; }
  @media (max-width: 600px) {
    div[style*="maxWidth: 780px"] { padding: 1.5rem 1rem 3rem !important; }
    div[style*="width: 180px"] { width: 120px !important; }
  }
`;