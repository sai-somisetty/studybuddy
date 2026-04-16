"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";

const DesktopShell = dynamic(() => import("./DesktopShell"), { ssr: false });

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <DesktopShell>{children}</DesktopShell>;
}
