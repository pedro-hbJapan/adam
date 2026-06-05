"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  navItems: NavItem[];
}

export function DashboardLayoutClient({
  children,
  userName,
  userRole,
  navItems,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>Adam</div>
        <div style={styles.userInfo}>
          <div style={styles.userName}>{userName}</div>
          <div style={styles.userRole}>{userRole}</div>
        </div>
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...styles.navLink,
                ...(pathname === item.href ? styles.navLinkActive : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={styles.signOutBtn}
        >
          ログアウト
        </button>
      </aside>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
  },
  sidebar: {
    width: 240,
    background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    padding: "1.5rem 1rem",
    flexShrink: 0,
  },
  logo: {
    fontSize: "1.75rem",
    fontWeight: 800,
    marginBottom: "1.5rem",
    letterSpacing: "-0.5px",
  },
  userInfo: {
    background: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    padding: "0.75rem 1rem",
    marginBottom: "1.5rem",
  },
  userName: {
    fontWeight: 600,
    fontSize: "0.95rem",
  },
  userRole: {
    fontSize: "0.75rem",
    opacity: 0.8,
    marginTop: "0.2rem",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    flex: 1,
  },
  navLink: {
    display: "block",
    padding: "0.6rem 0.9rem",
    borderRadius: 6,
    color: "rgba(255,255,255,0.85)",
    textDecoration: "none",
    fontSize: "0.9rem",
    transition: "background 0.15s",
  },
  navLinkActive: {
    background: "rgba(255,255,255,0.25)",
    color: "white",
    fontWeight: 600,
  },
  main: {
    flex: 1,
    padding: "2rem",
    background: "#f8f9fa",
    overflowY: "auto",
  },
  signOutBtn: {
    marginTop: "auto",
    padding: "0.6rem 1rem",
    background: "rgba(255,255,255,0.2)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "0.875rem",
    textAlign: "left",
  },
};
