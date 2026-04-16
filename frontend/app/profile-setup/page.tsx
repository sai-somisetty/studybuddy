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
  steel: "#4B6382",
};

const sans = "'DM Sans', sans-serif";
const serif = "'DM Serif Display', serif";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Telangana",
  "Tamil Nadu",
  "Karnataka",
  "Kerala",
  "Maharashtra",
  "Gujarat",
  "Rajasthan",
  "Madhya Pradesh",
  "Uttar Pradesh",
  "Bihar",
  "West Bengal",
  "Odisha",
  "Punjab",
  "Haryana",
  "Delhi",
  "Other",
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [state, setState] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameFocus, setNameFocus] = useState(false);

  const steps = ["name", "gender", "state", "language"];
  const currentStep = steps[step];

  const goNext = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
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
          auth_id,
          email,
          name: name.trim(),
          gender,
          state,
          language_pref: language,
        }),
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

  const inputStyle = (focused: boolean): CSSProperties => ({
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    fontSize: 18,
    color: C.navy,
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: sans,
    border: focused ? `2px solid ${C.navy}` : "1px solid rgba(7,23,57,0.12)",
    boxShadow: focused ? "0 0 0 3px rgba(7,23,57,0.1)" : "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  });

  const ctaStyle =
    canNext() && !loading
      ? { background: C.gold, color: C.navy, cursor: "pointer" as const }
      : {
          background: "rgba(227,195,157,0.25)",
          color: "rgba(7,23,57,0.45)",
          cursor: "default" as const,
        };

  const selectCard = (active: boolean) => ({
    padding: "14px 16px",
    borderRadius: 14,
    border: active ? `2px solid ${C.gold}` : "1px solid rgba(7,23,57,0.1)",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    textAlign: "left" as const,
    fontFamily: sans,
    width: "100%",
    boxSizing: "border-box" as const,
  });

  return (
    <div
      className="app-shell"
      style={{
        minHeight: "100vh",
        background: C.navy,
        display: "flex",
        flexDirection: "column",
        padding: `max(20px, env(safe-area-inset-top, 20px)) 20px max(28px, env(safe-area-inset-bottom, 28px))`,
        fontFamily: sans,
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span
            style={{
              border: `1px solid ${C.gold}`,
              color: C.gold,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              padding: "5px 10px",
              borderRadius: 4,
            }}
          >
            MAMA
          </span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: C.silver, marginBottom: 8 }}>
            Step {step + 1} of {steps.length}
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 4 }}>
            <motion.div
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              style={{ height: "100%", background: C.gold, borderRadius: 4 }}
            />
          </div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "#fff",
              margin: "16px 0 8px",
              fontFamily: serif,
              lineHeight: 1.25,
            }}
          >
            {currentStep === "name" && "What's your name?"}
            {currentStep === "gender" && `Nice to meet you, ${name}!`}
            {currentStep === "state" && "Which state are you from?"}
            {currentStep === "language" && "How do you like to study?"}
          </h1>
          <p style={{ fontSize: 14, color: C.silver, margin: 0, lineHeight: 1.5 }}>
            {currentStep === "name" && "Mama will call you by your name."}
            {currentStep === "gender" && "Helps Mama personalize your experience."}
            {currentStep === "state" && "Mama will use examples from your region."}
            {currentStep === "language" && "Choose your preferred explanation style."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === "name" && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
            >
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canNext() && goNext()}
                onFocus={() => setNameFocus(true)}
                onBlur={() => setNameFocus(false)}
                placeholder="Enter your first name"
                style={inputStyle(nameFocus)}
              />
            </motion.div>
          )}

          {currentStep === "gender" && (
            <motion.div
              key="gender"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              {[
                { id: "female", label: "Female", emoji: "👩" },
                { id: "male", label: "Male", emoji: "👨" },
                { id: "other", label: "Prefer not to say", emoji: "🙂" },
              ].map((g) => (
                <motion.button
                  key={g.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setGender(g.id)}
                  style={selectCard(gender === g.id)}
                >
                  <span style={{ fontSize: 24 }}>{g.emoji}</span>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: gender === g.id ? C.gold : C.navy,
                      flex: 1,
                    }}
                  >
                    {g.label}
                  </span>
                  {gender === g.id && <span style={{ color: C.gold, fontWeight: 700 }}>✓</span>}
                </motion.button>
              ))}
            </motion.div>
          )}

          {currentStep === "state" && (
            <motion.div
              key="state"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
            >
              {INDIAN_STATES.map((s) => (
                <motion.button
                  key={s}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setState(s)}
                  style={{
                    ...selectCard(state === s),
                    padding: "12px 10px",
                    fontSize: 12,
                    fontWeight: state === s ? 700 : 500,
                    color: state === s ? C.gold : C.navy,
                    justifyContent: "center",
                  }}
                >
                  {s}
                  {state === s ? " ✓" : ""}
                </motion.button>
              ))}
            </motion.div>
          )}

          {currentStep === "language" && (
            <motion.div
              key="language"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              {[
                {
                  id: "tenglish",
                  label: "Tenglish",
                  sublabel: "Telugu + English mix (Default)",
                  emoji: "🗣️",
                },
                {
                  id: "english",
                  label: "Full English",
                  sublabel: "Pure English explanations",
                  emoji: "🇬🇧",
                },
                { id: "hindi", label: "Hinglish", sublabel: "Hindi + English mix", emoji: "🇮🇳" },
              ].map((l) => (
                <motion.button
                  key={l.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLanguage(l.id)}
                  style={selectCard(language === l.id)}
                >
                  <span style={{ fontSize: 24 }}>{l.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: language === l.id ? C.gold : C.navy,
                      }}
                    >
                      {l.label}
                    </div>
                    <div style={{ fontSize: 11, color: C.steel, marginTop: 2 }}>{l.sublabel}</div>
                  </div>
                  {language === l.id && <span style={{ color: C.gold, fontWeight: 700 }}>✓</span>}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: 28 }}>
          <motion.button
            type="button"
            whileTap={{ scale: canNext() && !loading ? 0.98 : 1 }}
            onClick={goNext}
            disabled={!canNext() || loading}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 14,
              border: "none",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: sans,
              ...ctaStyle,
            }}
          >
            {loading ? "Saving…" : step < steps.length - 1 ? "Continue →" : "Let's start"}
          </motion.button>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              style={{
                width: "100%",
                marginTop: 12,
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
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
