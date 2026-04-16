// SOMi Icon Library
// Navy+gold SVG icons — replaces all emojis across the app
// Usage: import { SomiIcons } from "@/components/SomiIcons";
//        <SomiIcons.Bolt size={16} />

import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}

const D = { navy: "#071739", gold: "#E3C39D", sand: "#A68868", steel: "#4B6382" };

function I({ size = 16, color = D.navy, opacity = 1, children, vb = "0 0 24 24" }: IconProps & { children: React.ReactNode; vb?: string }) {
  return (
    <svg width={size} height={size} viewBox={vb} fill="none" style={{ opacity, flexShrink: 0, display: "inline-block", verticalAlign: "middle" }}>
      {children}
    </svg>
  );
}

export const SomiIcons = {
  // ── TAB ICONS ──
  Bolt: ({ size, color = D.gold, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill={color} /></I>
  ),
  Pen: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></I>
  ),
  BookOpen: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></I>
  ),
  Book: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={color} strokeWidth="2" strokeLinecap="round" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={color} strokeWidth="2" /></I>
  ),
  FileText: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),

  // ── ACTIONS ──
  Star: ({ size, color = D.gold, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={color} /></I>
  ),
  StarOutline: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={color} strokeWidth="2" strokeLinejoin="round" /></I>
  ),
  Flag: ({ size, color = "#C0392B", opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12z" fill={color} opacity={0.8} /><line x1="4" y1="22" x2="4" y2="15" stroke={color} strokeWidth="2" /></I>
  ),
  Bookmark: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke={color} strokeWidth="2" strokeLinejoin="round" /></I>
  ),
  Check: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></I>
  ),
  CheckCircle: ({ size, color = "#16a34a", opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></I>
  ),
  X: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),
  XCircle: ({ size, color = "#ef4444", opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),

  // ── NAVIGATION ──
  ChevronLeft: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></I>
  ),
  ChevronRight: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></I>
  ),
  ArrowRight: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></I>
  ),
  Menu: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M3 12h18M3 6h18M3 18h18" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),

  // ── STATUS / GAMIFICATION ──
  Flame: ({ size, color = D.gold, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M12 22c4-2.5 6-6 6-10 0-3-2.5-5-4-6.5-.5 2-2 3.5-3.5 4C9 8 10 5 8.5 2 6 4 4 7 4 12c0 4 2 7.5 6 10h4z" fill={color} /></I>
  ),
  Trophy: ({ size, color = D.gold, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2" stroke={color} strokeWidth="2" /><path d="M6 3h12v6a6 6 0 01-12 0V3z" stroke={color} strokeWidth="2" /><path d="M12 15v4M8 21h8M9 19h6" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),
  Celebration: ({ size, color = D.gold, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M5.8 11.3L2 22l10.7-3.8" stroke={color} strokeWidth="2" strokeLinecap="round" /><path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01M2 15h.01" stroke={color} strokeWidth="3" strokeLinecap="round" /><path d="M9.1 8.9l2 2" stroke={color} strokeWidth="2" strokeLinecap="round" /><path d="M13.6 5.2l4.2 4.2" stroke={color} strokeWidth="2" strokeLinecap="round" /><path d="M17.3 7.5c1.5-1.5 2.5-3.5 0-6" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),
  Target: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" /><circle cx="12" cy="12" r="2" fill={color} /></I>
  ),
  Key: ({ size, color = D.gold, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><circle cx="15.5" cy="8.5" r="5.5" stroke={color} strokeWidth="2" /><path d="M11.5 12.5L3 21M7 17l2.5 2.5M3 21l2.5-2.5" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),

  // ── CONTENT TYPE ──
  Headphones: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M3 18v-6a9 9 0 0118 0v6" stroke={color} strokeWidth="2" /><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z" fill={color} /></I>
  ),
  Verified: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M12 2l2.4 3.6H18l.6 3.6L22 12l-3.4 2.8-.6 3.6h-3.6L12 22l-2.4-3.6H6l-.6-3.6L2 12l3.4-2.8.6-3.6h3.6L12 2z" fill={color} opacity={0.1} stroke={color} strokeWidth="1.5" /><path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></I>
  ),
  Pin: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" stroke={color} strokeWidth="2" /><circle cx="12" cy="10" r="3" fill={color} /></I>
  ),

  // ── EMOTIONS (for confidence/feedback) ──
  Unsure: ({ size, color = D.steel, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><circle cx="9" cy="10" r="1" fill={color} /><circle cx="15" cy="10" r="1" fill={color} /><path d="M8 15s1.5 1 4 1 4-1 4-1" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></I>
  ),
  Okay: ({ size, color = D.sand, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><circle cx="9" cy="10" r="1" fill={color} /><circle cx="15" cy="10" r="1" fill={color} /><path d="M8 14.5s1.5 2 4 2 4-2 4-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></I>
  ),
  Strong: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M4 15.5C4 12 6 9 9 8l1-4h4l1 4c3 1 5 4 5 7.5V18a2 2 0 01-2 2H6a2 2 0 01-2-2v-2.5z" stroke={color} strokeWidth="2" strokeLinecap="round" /><path d="M8 14h2M14 14h2" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),

  // ── FAILURE REASONS ──
  Brain: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M12 2a7 7 0 00-7 7c0 2.5 1.3 4.7 3.3 6L12 22l3.7-7C17.7 13.7 19 11.5 19 9a7 7 0 00-7-7z" stroke={color} strokeWidth="2" /><path d="M9 9c0-1.5 1.5-3 3-3s3 1.5 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),
  Facepalm: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><path d="M8 16s1 1 4 1 4-1 4-1" stroke={color} strokeWidth="1.5" strokeLinecap="round" /><line x1="7" y1="8" x2="17" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),
  Eye: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke={color} strokeWidth="2" /><circle cx="12" cy="12" r="3" fill={color} /></I>
  ),

  // ── MISC ──
  Pray: ({ size, color = D.gold, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M12 2v6M8.5 8.5l-2-2M15.5 8.5l2-2M12 8a4 4 0 014 4v8H8v-8a4 4 0 014-4z" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),
  Wave: ({ size, color = D.gold, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M7 11a5 5 0 015-5 5 5 0 015 5" stroke={color} strokeWidth="2" strokeLinecap="round" /><path d="M5 15a9 9 0 017-9 9 9 0 017 9" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.5} /><circle cx="12" cy="18" r="2" fill={color} /></I>
  ),
  Rocket: ({ size, color = D.gold, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M12 2C8 6 6 10 6 14l3 3h6l3-3c0-4-2-8-6-12z" stroke={color} strokeWidth="2" strokeLinejoin="round" /><circle cx="12" cy="11" r="2" fill={color} /><path d="M8 17l-2 4h12l-2-4" stroke={color} strokeWidth="2" strokeLinejoin="round" /></I>
  ),
  Mail: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="2" /><path d="M22 4L12 13 2 4" stroke={color} strokeWidth="2" strokeLinejoin="round" /></I>
  ),
  Bell: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" /><path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),
  Settings: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="2" /></I>
  ),
  User: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" /><path d="M4 21v-1a6 6 0 0112 0v1" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),
  Calendar: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" /><path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),
  CreditCard: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="2" /><line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="2" /></I>
  ),
  Logout: ({ size, color = "#C0392B", opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth="2" /><path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></I>
  ),
  GraduationCap: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M22 10L12 5 2 10l10 5 10-5z" stroke={color} strokeWidth="2" strokeLinejoin="round" /><path d="M6 12v5c0 2 3 3.5 6 3.5s6-1.5 6-3.5v-5" stroke={color} strokeWidth="2" /><line x1="22" y1="10" x2="22" y2="16" stroke={color} strokeWidth="2" /></I>
  ),
  Chart: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><rect x="3" y="12" width="4" height="9" rx="1" fill={color} opacity={0.3} /><rect x="10" y="8" width="4" height="13" rx="1" fill={color} opacity={0.6} /><rect x="17" y="4" width="4" height="17" rx="1" fill={color} /></I>
  ),
  Refresh: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M1 4v6h6M23 20v-6h-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></I>
  ),
  Timer: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><circle cx="12" cy="13" r="9" stroke={color} strokeWidth="2" /><path d="M12 9v4l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" /><path d="M10 2h4" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),
  Warning: ({ size, color = D.sand, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M12 2L2 22h20L12 2z" stroke={color} strokeWidth="2" strokeLinejoin="round" /><line x1="12" y1="9" x2="12" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="18" r="1" fill={color} /></I>
  ),
  Info: ({ size, color = D.steel, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" /><line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="8" r="1" fill={color} /></I>
  ),
  Lightbulb: ({ size, color = D.gold, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M9 21h6M12 3a6 6 0 014 10.5V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-3.5A6 6 0 0112 3z" stroke={color} strokeWidth="2" strokeLinecap="round" /></I>
  ),
  Chat: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke={color} strokeWidth="2" strokeLinejoin="round" /></I>
  ),
  Folder: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" stroke={color} strokeWidth="2" /></I>
  ),
  Scale: ({ size, color = D.navy, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M12 2v20M2 7l10-5 10 5M4 7l2 8h4l2-8M12 7l2 8h4l2-8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></I>
  ),
  TrendingUp: ({ size, color = D.gold, opacity }: IconProps) => (
    <I size={size} color={color} opacity={opacity}><path d="M23 6l-9.5 9.5-5-5L1 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M17 6h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></I>
  ),
};

export default SomiIcons;
