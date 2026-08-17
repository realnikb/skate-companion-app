"use client";

import { useActionState, useMemo, useState } from "react";
import { importStickPaths, type StickPathImportState } from "@/app/studio/stick-paths/import/actions";
import { previewStickPathImport, readStickPathImport, type ExistingStickPath, type StickPathImportPreview } from "@/lib/studio/stick-path-import";
import styles from "@/app/studio/studio.module.scss";

function summary(items: StickPathImportPreview[]) {
    return { create: items.filter((item) => item.action === "create").length, update: items.filter((item) => item.action === "update").length, unchanged: items.filter((item) => item.action === "unchanged").length, error: items.filter((item) => item.action === "error").length };
}

export function StickPathImporter({ existing }: { existing: ExistingStickPath[] }) {
    const [json, setJson] = useState("");
    const [fileName, setFileName] = useState("");
    const [parseError, setParseError] = useState("");
    const [preview, setPreview] = useState<StickPathImportPreview[] | null>(null);
    const [state, formAction, pending] = useActionState(importStickPaths, { status: "idle" } as StickPathImportState);
    const counts = useMemo(() => preview ? summary(preview) : null, [preview]);

    function buildPreview(value = json) {
        try {
            const rows = readStickPathImport(value);
            if (!rows.length) throw new Error("The import contains no stick controls.");
            if (rows.length > 500) throw new Error("An import can contain at most 500 stick controls.");
            setPreview(previewStickPathImport(rows, existing)); setParseError("");
        } catch (error) { setPreview(null); setParseError(error instanceof Error ? error.message : "Invalid JSON."); }
    }

    async function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 750_000) { setPreview(null); setParseError("The import is too large (750 KB maximum)."); return; }
        const value = await file.text();
        setFileName(file.name); setJson(value); buildPreview(value);
    }

    function editJson(value: string) { setJson(value); setPreview(null); setParseError(""); }

    return <form action={formAction} className={styles.importer}>
        <input type="hidden" name="json" value={json} />
        <section className={styles.panel}>
            <div className={styles.importHeading}><div><span>Step 1</span><h2>Choose an export</h2><p>Accepts an array or an export containing <code>stick_inputs</code> or <code>stick_paths</code>. Timestamps and other metadata are ignored.</p></div><label className={styles.primaryButton}>Choose JSON<input type="file" accept="application/json,.json" onChange={selectFile} /></label></div>
            {fileName && <p className={styles.selectedFile}>Selected: <strong>{fileName}</strong></p>}
            <label className={styles.field}><span>JSON</span><textarea className={styles.code} value={json} onChange={(event) => editJson(event.target.value)} placeholder='{"stick_inputs": […]}' spellCheck={false} /></label>
            <div className={styles.importActions}><button type="button" onClick={() => buildPreview()} disabled={!json.trim()}>Preview import</button>{parseError && <p className={styles.error} role="alert">{parseError}</p>}</div>
        </section>
        {preview && counts && <section className={styles.panel}>
            <div className={styles.importHeading}><div><span>Step 2</span><h2>Review changes</h2><p>Matched by UUID first, then slug. Nothing has been written yet.</p></div></div>
            <div className={styles.importSummary}><article><strong>{counts.create}</strong><span>Create</span></article><article><strong>{counts.update}</strong><span>Update</span></article><article><strong>{counts.unchanged}</strong><span>Unchanged</span></article><article className={counts.error ? styles.importErrorCount : undefined}><strong>{counts.error}</strong><span>Errors</span></article></div>
            <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Action</th><th>Stick control</th><th>Path</th><th>Details</th></tr></thead><tbody>{preview.map((item) => <tr key={`${item.index}-${item.input?.id ?? "invalid"}`}><td><span className={`${styles.importBadge} ${styles[`import${item.action[0].toUpperCase()}${item.action.slice(1)}`]}`}>{item.action}</span></td><td><strong>{item.input?.name ?? `Entry ${item.index + 1}`}</strong><small>{item.input ? `/${item.input.slug}` : "Invalid entry"}</small></td><td>{item.input ? `${item.input.points.length} points` : "—"}</td><td>{item.error ?? (item.changes.join("; ") || "Already matches")}</td></tr>)}</tbody></table></div>
            <footer className={styles.importCommit}><div><strong>Ready to import?</strong><span>{counts.error ? "Fix every error before importing." : `${counts.create + counts.update} database rows will change.`}</span></div><button type="submit" disabled={pending || counts.error > 0 || counts.create + counts.update === 0}>{pending ? "Importing…" : "Run import"}</button></footer>
            {state.message && <p className={state.status === "error" ? styles.importResultError : styles.importResultSuccess} role="status">{state.message}</p>}
        </section>}
    </form>;
}
