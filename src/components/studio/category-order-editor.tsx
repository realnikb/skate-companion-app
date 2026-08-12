"use client";

import { ArrowDown, ArrowUp, GripVertical, Pencil } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { reorderCategories, type StudioActionState } from "@/app/studio/actions";
import styles from "@/app/studio/studio.module.scss";

type CategoryItem = { id: string; name: string; slug: string; description: string | null; isPublished: boolean; trickCount: number; parentName?: string };
const initialState: StudioActionState = { status: "idle" };

export function CategoryOrderEditor({ categories }: { categories: CategoryItem[] }) {
    const [items, setItems] = useState(categories);
    const [draggedId, setDraggedId] = useState<string>();
    const [state, formAction, pending] = useActionState(reorderCategories, initialState);
    const changed = items.some((item, index) => item.id !== categories[index]?.id);

    function move(from: number, to: number) {
        if (to < 0 || to >= items.length || from === to) return;
        setItems((current) => { const next = [...current]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; });
    }

    return (
        <form action={formAction} className={styles.orderEditor}>
            <input type="hidden" name="category_ids" value={JSON.stringify(items.map((item) => item.id))} />
            <div className={styles.orderHelp}><div><strong>Frontend category order</strong><span>Drag categories into position. This controls the filters and sections on the public Skatepedia.</span></div><span>{changed ? "Unsaved changes" : "Order is saved"}</span></div>
            <ol className={styles.orderList}>{items.map((category, index) => (
                <li className={draggedId === category.id ? styles.draggingCategory : ""} draggable key={category.id} onDragStart={(event) => { setDraggedId(category.id); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDraggedId(undefined)} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => { event.preventDefault(); const from = items.findIndex((item) => item.id === draggedId); if (from >= 0) move(from, index); setDraggedId(undefined); }}>
                    <button className={styles.dragHandle} type="button" aria-label={`Drag ${category.name}`}><GripVertical /></button>
                    <span className={styles.orderNumber}>{String(index + 1).padStart(2, "0")}</span>
                    <div className={styles.orderCategory}><strong>{category.parentName && <em>{category.parentName} / </em>}{category.name}</strong><span>/{category.slug} · {category.trickCount} direct tricks</span><p>{category.description || "No category description yet."}</p></div>
                    <span className={`${styles.status} ${!category.isPublished ? styles.draft : ""}`}>{category.isPublished ? "Published" : "Draft"}</span>
                    <div className={styles.orderButtons}><button type="button" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={`Move ${category.name} up`}><ArrowUp /></button><button type="button" disabled={index === items.length - 1} onClick={() => move(index, index + 1)} aria-label={`Move ${category.name} down`}><ArrowDown /></button><Link href={`/studio/categories/${category.id}`} aria-label={`Edit ${category.name}`}><Pencil /></Link></div>
                </li>
            ))}</ol>
            <div className={styles.orderActions}>{state.message && <p className={state.status === "error" ? styles.error : undefined} role="status">{state.message}</p>}<button type="submit" disabled={pending || !changed}>{pending ? "Saving…" : "Save frontend order"}</button></div>
        </form>
    );
}
