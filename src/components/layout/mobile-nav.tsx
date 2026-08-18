"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, UserRound, Video } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./mobile-nav.module.scss";

export function MobileNav({ avatarUrl }: { avatarUrl?: string }) {
  const pathname = usePathname();
  const isFooty = pathname.startsWith("/social/footy");
  const [collapsed, setCollapsed] = useState(false);
  const [lastY, setLastY] = useState(0);
  const active =
    pathname === "/"
      ? "home"
      : pathname.startsWith("/tricks")
        ? "learn"
        : pathname.startsWith("/social")
          ? "footy"
          : pathname.startsWith("/account")
            ? "profile"
            : "home";

  useEffect(() => {
    if (isFooty) return;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 120 && y > lastY + 8) setCollapsed(true);
      setLastY(y);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isFooty, lastY]);

  useEffect(() => {
    if (isFooty) return;
    document.documentElement.dataset.mobileNav = collapsed ? "collapsed" : "expanded";
    return () => {
      delete document.documentElement.dataset.mobileNav;
    };
  }, [collapsed, isFooty]);

  const items = [
    { id: "home", label: "Home", href: "/", icon: Home },
    { id: "learn", label: "Learn", href: "/tricks", icon: BookOpen },
    { id: "footy", label: "Footy", href: "/social", icon: Video },
    { id: "profile", label: "Profile", href: "/account", icon: UserRound },
  ];
  const current = items.find((item) => item.id === active) ?? items[0];
  if (isFooty) return null;
  return (
    <nav
      className={`${styles.mobileNav} ${collapsed ? styles.collapsed : ""}`}
      aria-label="Mobile navigation"
    >
      <div className={`${styles.expandedView} ${collapsed ? styles.hiddenView : ""}`}>
        {items.map(({ id, label, href, icon: Icon }) => (
          <Link
            className={id === active ? styles.active : ""}
            href={href}
            key={id}
          >
            <span className={styles.iconWrap}>
              {id === "profile" && avatarUrl ? (
                <Image src={avatarUrl} alt="" width={22} height={22} />
              ) : (
                <Icon />
              )}
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
      <div className={`${styles.collapsedView} ${collapsed ? styles.visibleView : ""}`}>
        <Link
          className={styles.collapsedButton}
          href={current.href}
          aria-label={`Current page: ${current.label}. Tap to expand navigation`}
          onClick={(event) => {
            event.preventDefault();
            setCollapsed(false);
          }}
        >
          {active === "profile" && avatarUrl ? (
            <Image src={avatarUrl} alt="" width={28} height={28} />
          ) : (
            <current.icon />
          )}
        </Link>
      </div>
    </nav>
  );
}
