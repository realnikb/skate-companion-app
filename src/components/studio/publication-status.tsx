import styles from "@/app/studio/studio.module.scss";

type PublicationStatusProps = {
  isPublished: boolean;
  contentType: "trick" | "category" | "page";
};

export function PublicationStatus({
  isPublished,
  contentType,
}: PublicationStatusProps) {
  const publicDescription =
    contentType === "trick"
      ? "Visible in Skatepedia, search, and its public trick page."
      : contentType === "category"
        ? "Visible in navigation and on its public category page."
        : "Visible to everyone at its public URL.";

  return (
    <fieldset className={styles.publicationStatus}>
      <legend>Status</legend>
      <label>
        <input
          type="radio"
          name="publication_status"
          value="draft"
          defaultChecked={!isPublished}
        />
        <span>
          <strong>Draft</strong>
          <small>
            Only Studio editors can see it. Keep working without publishing
            changes.
          </small>
        </span>
      </label>
      <label>
        <input
          type="radio"
          name="publication_status"
          value="published"
          defaultChecked={isPublished}
        />
        <span>
          <strong>Published</strong>
          <small>{publicDescription}</small>
        </span>
      </label>
    </fieldset>
  );
}
