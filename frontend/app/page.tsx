"use client";
// SOMI Login Screen — compact brand band on mobile, side by side on desktop

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setTimeout(() => router.push("/home"), 800);
  };

  return (
    <div className="login-wrap">

      {/* ── BRAND PANEL ── compact on mobile, full height on desktop ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="login-brand"
      >
        {/* Logo — always visible */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "Georgia,serif" }}>SB</span>
          </div>
          <span style={{ color: "#fff", fontSize: 20, fontWeight: 700, fontFamily: "Georgia,serif" }}>SOMI</span>
        </div>

        {/* Headline — hidden on mobile, visible on desktop */}
        <div className="brand-content">
          <h1 style={{
            color: "#fff",
            fontSize: "clamp(24px,4vw,40px)",
            fontWeight: 700,
            fontFamily: "Georgia,serif",
            lineHeight: 1.25,
            marginBottom: 16,
          }}>
            Student's Own<br />Mentor Intelligence
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.9 }}>
            Mama explains.<br />Kitty asks.<br />You pass.
          </p>
        </div>

        {/* Stats — hidden on mobile, visible on desktop */}
        <div className="brand-stats">
          {[
            { val: "₹99",      label: "per month" },
            { val: "CA / CMA", label: "foundation" },
            { val: "Beta",     label: "invite only", color: "#E67E22" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {i > 0 && <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.15)" }} />}
              <div>
                <div style={{ color: s.color || "#fff", fontSize: 18, fontWeight: 700, fontFamily: "Georgia,serif" }}>{s.val}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── FORM PANEL ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="login-form"
      >
        <div style={{ maxWidth: 440, width: "100%" }}>

          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1A1208", fontFamily: "Georgia,serif", marginBottom: 4 }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 13, color: "#A89880", marginBottom: 28 }}>
            Beta access · Invite only
          </p>

          {/* Email */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#1A1208", letterSpacing: "0.06em", marginBottom: 8 }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "1.5px solid #C8C0B4", background: "#FAFAF8", fontSize: 15, color: "#1A1208", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#1A1208", letterSpacing: "0.06em", marginBottom: 8 }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "1.5px solid #C8C0B4", background: "#FAFAF8", fontSize: 15, color: "#1A1208", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Forgot */}
          <div style={{ textAlign: "right", marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: "#0E6655", fontWeight: 500, cursor: "pointer" }}>Forgot password?</span>
          </div>

          {/* Login button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            style={{ width: "100%", padding: "15px", borderRadius: 16, background: "#0A2E28", color: "#fff", fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer", marginBottom: 14 }}
          >
            {loading ? "Entering SOMI..." : "Enter SOMI →"}
          </motion.button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: "#EDE8E0" }} />
            <span style={{ fontSize: 12, color: "#A89880" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#EDE8E0" }} />
          </div>

          {/* Google */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            style={{ width: "100%", padding: "14px", borderRadius: 16, border: "1.5px solid #C8C0B4", background: "#fff", fontSize: 14, color: "#1A1208", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxSizing: "border-box" }}
          >
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#EA4335", flexShrink: 0 }} />
            Continue with Google
          </motion.button>

          <p style={{ textAlign: "center", fontSize: 12, color: "#A89880", marginTop: 20 }}>
            Beta access by invite only ·{" "}
            <span style={{ color: "#0E6655", fontWeight: 500, cursor: "pointer" }}>Request access</span>
          </p>

        </div>
      </motion.div>

    </div>
  );
}