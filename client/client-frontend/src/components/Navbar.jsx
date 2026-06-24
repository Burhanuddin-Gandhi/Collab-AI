import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  const getInitials = (name = "") =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    setMenuOpen(false);
  };

  const navLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "History", path: "/history" },
    { label: "Profile", path: "/profile" },
  ];

  const goTo = (path) => { navigate(path); setMenuOpen(false); };

  return (
    <>
      <style>{css}</style>
      <nav style={styles.nav}>

        <div style={styles.logo} onClick={() => navigate("/dashboard")}>⚡ CollabAI</div>

        {/* Desktop links */}
        <div style={styles.links} className="nav-links">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => goTo(link.path)}
                style={{ ...styles.link, color: isActive ? "#7ec8a4" : "#e4ede8" }}
                className="nav-link"
              >
                {link.label}
                {isActive && <span style={styles.underline} />}
              </button>
            );
          })}
        </div>

        {/* Desktop right */}
        <div style={styles.right} className="nav-right">
          <div style={styles.userChip} onClick={() => navigate("/profile")} className="user-chip">
            <div style={{ ...styles.avatar, background: user?.avatarColor || "#5aaa84", overflow: "hidden" }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="avatar" />
                : getInitials(user?.name)
              }
            </div>
            <span style={styles.userName}>{user?.name}</span>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout} className="logout-btn">Logout</button>
        </div>

        {/* Hamburger */}
        <button style={styles.hamburger} className="hamburger" onClick={() => setMenuOpen(p => !p)}>
          <span style={{ ...styles.bar, transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
          <span style={{ ...styles.bar, opacity: menuOpen ? 0 : 1 }} />
          <span style={{ ...styles.bar, transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
        </button>

      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          <div style={styles.mobileUser}>
            <div style={{ ...styles.avatar, width: "34px", height: "34px", fontSize: "12px", background: user?.avatarColor || "#5aaa84", overflow: "hidden" }}>
              {user?.avatarUrl
                ? <img src={user.avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="avatar" />
                : getInitials(user?.name)
              }
            </div>
            <span style={styles.mobileUserName}>{user?.name}</span>
          </div>
          <div style={styles.mobileDivider} />
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => goTo(link.path)}
                style={{ ...styles.mobileLink, color: isActive ? "#7ec8a4" : "#e4ede8", background: isActive ? "#283830" : "none" }}
              >
                {link.label}
              </button>
            );
          })}
          <div style={styles.mobileDivider} />
          <button style={styles.mobileLogout} onClick={handleLogout}>Logout</button>
        </div>
      )}
    </>
  );
}

const styles = {
  nav: {
    width: "100%", display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "0 1.5rem", height: "62px",
    background: "#171e1b", borderBottom: "1px solid #3a5045",
    position: "sticky", top: 0, zIndex: 100, boxSizing: "border-box",
  },
  logo: {
    fontSize: "17px", fontWeight: "700", color: "#7ec8a4",
    letterSpacing: "-0.02em", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
  },
  links: {
    display: "flex", alignItems: "center", gap: "0.25rem",
    position: "absolute", left: "50%", transform: "translateX(-50%)",
  },
  link: {
    background: "none", border: "none", fontSize: "15px", fontWeight: "500",
    cursor: "pointer", padding: "6px 14px", borderRadius: "8px",
    fontFamily: "'DM Sans', sans-serif", position: "relative",
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "3px", transition: "color 0.2s", whiteSpace: "nowrap",
  },
  underline: {
    position: "absolute", bottom: "-2px", left: "14px", right: "14px",
    height: "2px", background: "#7ec8a4", borderRadius: "2px",
  },
  right: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  userChip: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "#1f2b25", border: "1px solid #3a5045",
    borderRadius: "30px", padding: "4px 14px 4px 4px",
    cursor: "pointer", transition: "border-color 0.2s",
  },
  avatar: {
    width: "28px", height: "28px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "11px", fontWeight: "700", color: "#171e1b", flexShrink: 0,
  },
  userName: {
    fontSize: "14px", color: "#e4ede8", fontWeight: "500",
    fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
  },
  logoutBtn: {
    background: "none", border: "1px solid #3a5045", color: "#e4ede8",
    borderRadius: "8px", padding: "7px 16px", fontSize: "14px",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s", whiteSpace: "nowrap",
  },
  hamburger: {
    display: "none", flexDirection: "column", gap: "5px",
    background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "8px",
  },
  bar: {
    display: "block", width: "22px", height: "2px",
    background: "#e4ede8", borderRadius: "2px", transition: "all 0.2s",
  },
  mobileMenu: {
    position: "fixed", top: "62px", left: 0, right: 0,
    background: "#1f2b25", borderBottom: "1px solid #3a5045",
    zIndex: 99, padding: "1rem", display: "flex",
    flexDirection: "column", gap: "4px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },
  mobileUser: { display: "flex", alignItems: "center", gap: "10px", padding: "0.5rem 0.75rem" },
  mobileUserName: { fontSize: "15px", color: "#e4ede8", fontWeight: "600", fontFamily: "'DM Sans', sans-serif" },
  mobileDivider: { height: "1px", background: "#3a5045", margin: "4px 0" },
  mobileLink: {
    background: "none", border: "none", textAlign: "left",
    fontSize: "15px", fontWeight: "500", cursor: "pointer",
    padding: "11px 12px", borderRadius: "8px",
    fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
  },
  mobileLogout: {
    background: "none", border: "none", textAlign: "left",
    fontSize: "15px", color: "#7a9688", cursor: "pointer",
    padding: "11px 12px", borderRadius: "8px",
    fontFamily: "'DM Sans', sans-serif",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .nav-link:hover { color: #7ec8a4 !important; background: #1f2b25; }
  .user-chip:hover { border-color: #7ec8a4 !important; }
  .logout-btn:hover { border-color: #7ec8a4 !important; color: #7ec8a4 !important; }
  @media (max-width: 680px) {
    .nav-links { display: none !important; }
    .nav-right { display: none !important; }
    .hamburger { display: flex !important; }
  }
`;
