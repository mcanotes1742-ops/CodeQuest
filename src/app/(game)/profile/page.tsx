"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Profile = avatar selection (same as after login) */
export default function ProfilePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/avatar-select");
  }, [router]);
  return (
    <main className="sky-bg min-h-screen flex items-center justify-center">
      <p className="text-cyan-400 font-display animate-pulse">Opening avatar select...</p>
    </main>
  );
}
