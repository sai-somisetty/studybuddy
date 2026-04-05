"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "https://studybuddy-production-7776.up.railway.app";

const INDIAN_STATES = [
  "Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka",
  "Kerala", "Maharashtra", "Gujarat", "Rajasthan",
  "Madhya Pradesh", "Uttar Pradesh", "Bihar", "West Bengal",
  "Odisha", "Punjab", "Haryana", "Delhi", "Other"
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [state, setState] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = ["name", "gender", "state", "language"];
  const currentStep = steps[step];

  const goNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else saveProfile();
  };

  const canNext = () => {
    if (currentStep === "name") return name.trim().length > 1;
    if (currentStep === "gender") return gender !== "";
    if (currentStep === "state") return state !== "";
    if (currentStep === "language") return language !== "";
    return false;
  };

  const saveProfile = async () => {
    setLoading(true);
    const auth_id = localStorage.getItem("somi_user_id");
    const email = localStorage.getItem("somi_email");
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_id, email, name: name.trim(),
          gender, state, language_pref: language
        })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("somi_student_name", name.trim());
        localStorage.setItem("somi_student_state", state);
        localStorage.setItem("somi_student_gender", gender);
        localStorage.setItem("somi_language_pref", language);
        router.push("/onboarding");
      }
    } catch {
      alert("Error saving profile. Try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{
      display: "flex", flexDirection: "column",
      padding: 24, background: "#f9f6f1"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0A2E28 0%, #0A4A3C 100%)",
        borderRadius: 16, padding: "16px 20px", marginBottom: 24
      }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
          Step {step + 1} of {steps.length}
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2 }}>
          <motion.div
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            style={{ height: "100%", background: "#E67E22", borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 10, fontFamily: "Georgia,serif" }}>
          {currentStep === "name" && "What's your name?"}
          {currentStep === "gender" && `Nice to meet you, ${name}!`}
          {currentStep === "state" && "Which state are you from?"}
          {currentStep === "language" && "How do you like to study?"}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
          {currentStep === "name" && "Mama will call you by your name!"}
          {currentStep === "gender" && "Helps Mama personalize your experience"}
          {currentStep === "state" && "Mama will use examples from your region"}
          {currentStep === "language" && "Choose your preferred explanation style"}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* NAME */}
        {currentStep === "name" && (
          <motion.div key="name"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canNext() && goNext()}
              placeholder="Enter your first name"
              style={{
                width: "100%", padding: "14px 16px",
                borderRadius: 12, border: "1.5px solid #E5E0D8",
                fontSize: 18, color: "#1A1208", background: "#fff",
                outline: "none", boxSizing: "border-box"
              }}
            />
          </motion.div>
        )}

        {/* GENDER */}
        {currentStep === "gender" && (
          <motion.div key="gender"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { id: "female", label: "Female", emoji: "👩" },
              { id: "male", label: "Male", emoji: "👨" },
              { id: "other", label: "Prefer not to say", emoji: "🙂" },
            ].map(g => (
              <motion.button key={g.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setGender(g.id)}
                style={{
                  padding: "14px 16px", borderRadius: 12,
                  border: gender === g.id ? "2px solid #0A2E28" : "1.5px solid #E5E0D8",
                  background: gender === g.id ? "#E1F5EE" : "#fff",
                  display: "flex", alignItems: "center", gap: 12,
                  cursor: "pointer", textAlign: "left"
                }}>
                <span style={{ fontSize: 24 }}>{g.emoji}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#1A1208" }}>{g.label}</span>
                {gender === g.id && <span style={{ marginLeft: "auto", color: "#0A2E28" }}>✓</span>}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* STATE */}
        {currentStep === "state" && (
          <motion.div key="state"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {INDIAN_STATES.map(s => (
              <motion.button key={s}
                whileTap={{ scale: 0.97 }}
                onClick={() => setState(s)}
                style={{
                  padding: "12px 10px", borderRadius: 12,
                  border: state === s ? "2px solid #0A2E28" : "1.5px solid #E5E0D8",
                  background: state === s ? "#E1F5EE" : "#fff",
                  fontSize: 12, fontWeight: state === s ? 700 : 500,
                  color: state === s ? "#0A2E28" : "#1A1208",
                  cursor: "pointer"
                }}>
                {s}
                {state === s && " ✓"}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* LANGUAGE */}
        {currentStep === "language" && (
          <motion.div key="language"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { id: "tenglish", label: "Tenglish", sublabel: "Telugu + English mix (Default)", emoji: "🗣️" },
              { id: "english", label: "Full English", sublabel: "Pure English explanations", emoji: "🇬🇧" },
              { id: "hindi", label: "Hinglish", sublabel: "Hindi + English mix", emoji: "🇮🇳" },
            ].map(l => (
              <motion.button key={l.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLanguage(l.id)}
                style={{
                  padding: "14px 16px", borderRadius: 12,
                  border: language === l.id ? "2px solid #0A2E28" : "1.5px solid #E5E0D8",
                  background: language === l.id ? "#E1F5EE" : "#fff",
                  display: "flex", alignItems: "center", gap: 12,
                  cursor: "pointer", textAlign: "left"
                }}>
                <span style={{ fontSize: 24 }}>{l.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1208" }}>{l.label}</div>
                  <div style={{ fontSize: 11, color: "#A89880", marginTop: 2 }}>{l.sublabel}</div>
                </div>
                {language === l.id && <span style={{ color: "#0A2E28" }}>✓</span>}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next button */}
      <div style={{ marginTop: 24 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={goNext}
          disabled={!canNext() || loading}
          style={{
            width: "100%", padding: "14px",
            borderRadius: 12, border: "none",
            background: canNext() && !loading ? "#0A2E28" : "#E5E0D8",
            color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: canNext() && !loading ? "pointer" : "default"
          }}>
          {loading ? "Saving..." : step < steps.length - 1 ? "Next →" : "Let's Start! 🚀"}
        </motion.button>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            style={{ width: "100%", marginTop: 10, padding: "10px", borderRadius: 12, border: "none", background: "transparent", color: "#A89880", fontSize: 12, cursor: "pointer" }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
