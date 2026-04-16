"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const C = { navy: "#071739", gold: "#E3C39D" };

export default function FloatingNav({
  active,
  subjectPath,
}: {
  active: "Home" | "Study" | "Exams" | "Progress" | "Profile";
  subjectPath?: string;
}) {
  const router = useRouter();
  const items = [
    { label: "Home" as const, path: "/home" },
    { label: "Study" as const, path: subjectPath || "/home" },
    { label: "Exams" as const, path: "/exams" },
    { label: "Progress" as const, path: "/progress" },
    { label: "Profile" as const, path: "/profile" },
  ];

  return (
    <div
      data-floating-nav="true"
      style={{
        position: "fixed",
        bottom: "max(20px, env(safe-area-inset-bottom, 20px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: C.navy,
          borderRadius: 999,
          padding: "7px",
          display: "flex",
          gap: 0,
          boxShadow: "0 8px 24px rgba(7,23,57,0.2), 0 2px 8px rgba(7,23,57,0.1)",
        }}
      >
        {items.map((item) => {
          const isActive = item.label === active;
          return (
            <motion.button
              key={item.label}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => router.push(item.path)}
              style={{
                background: isActive ? C.gold : "transparent",
                border: "none",
                cursor: "pointer",
                padding: "10px 12px",
                borderRadius: 999,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? C.navy : "rgba(255,255,255,0.55)",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {item.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
