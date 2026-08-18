import { createMap } from "../actions";
import styles from "../../studio.module.scss";
export default function NewMap() {
  return (
    <main className={styles.content}>
      <header className={styles.pageHeader}>
        <div>
          <span>World data</span>
          <h1>New map</h1>
          <p>Create the map record first, then draw its districts.</p>
        </div>
      </header>
      <form action={createMap} className={styles.formGrid}>
        <section className={styles.panel}>
          <h2>Map details</h2>
          <div className={styles.field}>
            <label>Name</label>
            <input name="name" required />
          </div>
          <div className={styles.field}>
            <label>Slug</label>
            <input name="slug" required pattern="[a-z0-9-]+" />
          </div>
          <div className={styles.field}>
            <label>Asset root</label>
            <input
              name="asset_root"
              required
              placeholder="/maps/isle-of-grom"
            />
          </div>
          <div className={styles.field}>
            <label>Description</label>
            <textarea name="description" />
          </div>
          <div className={styles.formActions}>
            <button type="submit">Create map</button>
          </div>
        </section>
      </form>
    </main>
  );
}
