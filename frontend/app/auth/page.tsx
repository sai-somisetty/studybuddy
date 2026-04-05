"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendOTP = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
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
        body: JSON.stringify({ email: email.trim().toLowerCase(), token: otp.trim() })
      });
      const data = await res.json();
      if (data.success) {
        // Save to localStorage
        localStorage.setItem("somi_auth_token", data.access_token);
        localStorage.setItem("somi_user_id", data.user_id);
        localStorage.setItem("somi_email", data.email);
        
        if (data.is_new) {
          // New student → profile setup
          router.push("/profile-setup");
        } else {
          // Existing student → save name and go home
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

  return (
    <div className="app-shell" style={{ 
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24, background: "#f9f6f1"
    }}>
      {/* Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ 
          width: 64, height: 64, borderRadius: 20,
          background: "#0A2E28", display: "flex",
          alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px"
        }}>
          <span style={{ fontSize: 28 }}>📖</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#0A2E28", fontFamily: "Georgia,serif" }}>
          SOMI
        </div>
        <div style={{ fontSize: 12, color: "#A89880", marginTop: 4 }}>
          CMA Exam Prep — Mama Style
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: "100%", maxWidth: 380,
          background: "#fff", borderRadius: 20,
          padding: 24, border: "0.5px solid rgba(0,0,0,0.08)"
        }}>

        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0A2E28", marginBottom: 6 }}>
                Welcome! 👋
              </div>
              <div style={{ fontSize: 13, color: "#A89880", marginBottom: 20 }}>
                Enter your email to get started
              </div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendOTP()}
                placeholder="your@email.com"
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 12, border: "1.5px solid #E5E0D8",
                  fontSize: 14, color: "#1A1208",
                  background: "#FAFAF8", outline: "none",
                  boxSizing: "border-box", marginBottom: 12
                }}
              />
              {error && (
                <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>
                  {error}
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={sendOTP}
                disabled={!email.trim() || loading}
                style={{
                  width: "100%", padding: "13px",
                  borderRadius: 12, border: "none",
                  background: email.trim() && !loading ? "#0A2E28" : "#E5E0D8",
                  color: "#fff", fontSize: 14, fontWeight: 600,
                  cursor: email.trim() && !loading ? "pointer" : "default"
                }}>
                {loading ? "Sending..." : "Send OTP →"}
              </motion.button>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0A2E28", marginBottom: 6 }}>
                Check your email 📧
              </div>
              <div style={{ fontSize: 13, color: "#A89880", marginBottom: 4 }}>
                We sent a 6-digit code to
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0A2E28", marginBottom: 20 }}>
                {email}
              </div>
              <input
                type="number"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                onKeyDown={e => e.key === "Enter" && verifyOTP()}
                placeholder="Enter 6-digit code"
                maxLength={6}
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 12, border: "1.5px solid #E5E0D8",
                  fontSize: 20, color: "#1A1208", letterSpacing: "0.2em",
                  background: "#FAFAF8", outline: "none",
                  boxSizing: "border-box", marginBottom: 12,
                  textAlign: "center"
                }}
              />
              {error && (
                <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>
                  {error}
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={verifyOTP}
                disabled={otp.length < 6 || loading}
                style={{
                  width: "100%", padding: "13px",
                  borderRadius: 12, border: "none",
                  background: otp.length >= 6 && !loading ? "#0A2E28" : "#E5E0D8",
                  color: "#fff", fontSize: 14, fontWeight: 600,
                  cursor: otp.length >= 6 && !loading ? "pointer" : "default",
                  marginBottom: 12
                }}>
                {loading ? "Verifying..." : "Verify OTP →"}
              </motion.button>
              <button
                onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                style={{
                  width: "100%", padding: "10px",
                  borderRadius: 12, border: "none",
                  background: "transparent", color: "#A89880",
                  fontSize: 12, cursor: "pointer"
                }}>
                ← Change email
              </button>
              <button
                onClick={sendOTP}
                disabled={loading}
                style={{
                  width: "100%", padding: "10px",
                  borderRadius: 12, border: "none",
                  background: "transparent", color: "#0A2E28",
                  fontSize: 12, cursor: "pointer", fontWeight: 600
                }}>
                Resend OTP
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
