import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FolderTree, Gamepad2, LayoutDashboard, Map, Shapes, UserRound } from "lucide-react";

import { requireStudioUser } from "@/lib/studio/auth";
import styles from "./studio.module.scss";

export const metadata: Metadata = {
    title: { default: "Studio", template: "%s | Skate Companion Studio" },
    robots: { index: false, follow: false },
};

export default async function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const { user } = await requireStudioUser();

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <Link className={styles.studioBrand} href="/studio"><span>SC<b>+</b></span><em>Studio</em></Link>
                <nav aria-label="Studio navigation">
                    <Link href="/studio"><LayoutDashboard />Overview</Link>
                    <Link href="/studio/tricks"><Shapes />Tricks</Link>
                    <Link href="/studio/stick-paths"><Gamepad2 />Stick paths</Link>
                    <Link href="/studio/categories"><FolderTree />Categories</Link>
                    <Link href="/studio/maps"><Map />Maps</Link>
                </nav>
                <div className={styles.sidebarFoot}>
                    <Link href="/" target="_blank">View site <ArrowUpRight /></Link>
                    <div><UserRound /><span>{user.email}<small>Administrator</small></span></div>
                </div>
            </aside>
            <div className={styles.workspace}>{children}</div>
        </div>
    );
}
