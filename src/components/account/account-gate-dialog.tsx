"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import styles from "./account-gate-dialog.module.scss";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  nextPath?: string;
};

export function AccountGateDialog({
  open,
  onOpenChange,
  title,
  description,
  nextPath = "/social",
}: Props) {
  const next = encodeURIComponent(nextPath);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        fullscreen
        overlayClassName={styles.backdrop}
        className={styles.takeover}
        aria-label={title}
      >
        <button
          type="button"
          className={styles.dismissSurface}
          onClick={() => onOpenChange(false)}
          aria-label="Close account prompt"
        />
        <div className={styles.panel}>
          <span className={styles.icon}>
            <Send />
          </span>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          <Link href={`/account/sign-up?next=${next}`}>
            Create free account
          </Link>
          <Link
            className={styles.signIn}
            href={`/account/sign-in?next=${next}`}
          >
            I already have an account
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
