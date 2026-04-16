"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

const C = {
  navy: "#071739",
  gold: "#E3C39D",
  silver: "#A4B5C4",
};

const sans = "'DM Sans', sans-serif";
const serif = "'DM Serif Display', serif";

const inputBase: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  fontSize: 16,
  color: C.navy,
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: sans,
  border: "1px solid rgba(7,23,57,0.12)",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailFocus, setEmailFocus] = useState(false);
  const [otpFocus, setOtpFocus] = useState(false);

  const sendOTP = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("otp");
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch {
      setError("Network error. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: otp.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("somi_auth_token", data.access_token);
        localStorage.setItem("somi_user_id", data.user_id);
        localStorage.setItem("somi_email", data.email);

        if (data.is_new) {
          router.push("/profile-setup");
        } else {
          localStorage.setItem("somi_student_name", data.student?.name || "Student");
          localStorage.setItem("somi_student_state", data.student?.state || "");
          router.push("/home");
        }
      } else {
        setError("Invalid OTP. Check your email and try again!");
      }
    } catch {
      setError("Network error. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const inputFocusStyle = (focused: boolean): CSSProperties =>
    focused
      ? {
          border: `2px solid ${C.navy}`,
          boxShadow: `0 0 0 3px rgba(7,23,57,0.12)`,
        }
      : {};

  const ctaEnabled = (ok: boolean) =>
    ok && !loading
      ? { background: C.gold, color: C.navy, cursor: "pointer" as const }
      : {
          background: "rgba(227,195,157,0.25)",
          color: "rgba(7,23,57,0.45)",
          cursor: "default" as const,
        };

  return (
    <div
      className="app-shell"
      style={{
        minHeight: "100vh",
        width: "100%",
        background: C.navy,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: `max(24px, env(safe-area-inset-top, 24px)) 24px max(32px, env(safe-area-inset-bottom, 32px))`,
        fontFamily: sans,
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 28 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: C.gold,
              color: C.navy,
              fontFamily: serif,
              fontSize: 22,
              fontWeight: 400,
              padding: "8px 20px",
              borderRadius: 6,
              transform: "rotate(-3deg)",
              boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
              marginBottom: 16,
            }}
          >
            SOM
            <i style={{ fontStyle: "italic", fontSize: 24 }}>i</i>
          </motion.div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.silver,
              lineHeight: 1.65,
              maxWidth: 320,
              margin: "0 auto",
            }}
          >
            Student Oriented Mentor Intelligence
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
              >
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#fff",
                    margin: "0 0 8px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Welcome
                </h1>
                <p style={{ fontSize: 14, color: C.silver, margin: "0 0 20px", lineHeight: 1.5 }}>
                  Enter your email to get started
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendOTP()}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  style={{ ...inputBase, ...inputFocusStyle(emailFocus), marginBottom: 12 }}
                />
                {error && (
                  <div style={{ fontSize: 13, color: "#FCA5A5", marginBottom: 12 }}>{error}</div>
                )}
                <motion.button
                  type="button"
                  whileTap={{ scale: email.trim() && !loading ? 0.98 : 1 }}
                  onClick={sendOTP}
                  disabled={!email.trim() || loading}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: "none",
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: sans,
                    ...ctaEnabled(!!email.trim()),
                  }}
                >
                  {loading ? "Sending…" : "Send OTP →"}
                </motion.button>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
              >
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#fff",
                    margin: "0 0 8px",
                  }}
                >
                  Check your email
                </h1>
                <p style={{ fontSize: 14, color: C.silver, margin: "0 0 6px" }}>
                  We sent a 6-digit code to
                </p>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    margin: "0 0 20px",
                    wordBreak: "break-all",
                  }}
                >
                  {email}
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && verifyOTP()}
                  onFocus={() => setOtpFocus(true)}
                  onBlur={() => setOtpFocus(false)}
                  placeholder="••••••"
                  maxLength={6}
                  style={{
                    ...inputBase,
                    ...inputFocusStyle(otpFocus),
                    marginBottom: 12,
                    fontSize: 22,
                    letterSpacing: "0.35em",
                    textAlign: "center",
                  }}
                />
                {error && (
                  <div style={{ fontSize: 13, color: "#FCA5A5", marginBottom: 12 }}>{error}</div>
                )}
                <motion.button
                  type="button"
                  whileTap={{ scale: otp.length >= 6 && !loading ? 0.98 : 1 }}
                  onClick={verifyOTP}
                  disabled={otp.length < 6 || loading}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: "none",
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: sans,
                    marginBottom: 12,
                    ...ctaEnabled(otp.length >= 6),
                  }}
                >
                  {loading ? "Verifying…" : "Verify OTP →"}
                </motion.button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 12,
                    border: "none",
                    background: "transparent",
                    color: C.silver,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: sans,
                  }}
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={sendOTP}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 12,
                    border: "none",
                    background: "transparent",
                    color: C.gold,
                    fontSize: 13,
                    cursor: loading ? "default" : "pointer",
                    fontWeight: 600,
                    fontFamily: sans,
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  Resend OTP
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
