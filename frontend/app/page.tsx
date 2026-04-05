"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("somi_auth_token");
    const name = localStorage.getItem("somi_student_name");
    if (token && name) {
      router.push("/home");
    } else {
      router.push("/auth");
    }
  }, [router]);

  return (
    <div style={{ 
      display: "flex", alignItems: "center", 
      justifyContent: "center", height: "100vh",
      background: "#f9f6f1"
    }}>
      <div style={{ 
        width: 40, height: 40, borderRadius: 12,
        background: "#0A2E28", display: "flex",
        alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>S</span>
      </div>
    </div>
  );
}
