import styles from "./PanelPlaceholder.module.css";

/**
 * Stands in for an interest whose panel is waiting on assets rather than on
 * code.
 *
 * Deliberately says what it is waiting for instead of showing a skeleton or a
 * spinner: this is not loading, it is unbuilt, and a shimmer that never
 * resolves is a worse lie than a sentence. Follows the same principle as
 * `IndexEmpty` in the index shell, which names the directory its content will
 * appear from.
 */
export default function PanelPlaceholder({
  noun,
  waitingFor,
}: {
  /** What this panel will hold, capitalised: `The pets`, `The lifting log`. */
  noun: string;
  /** What has to land first, in a few words. */
  waitingFor: string;
}) {
  return (
    <div className={styles.panel}>
      <p className={styles.text}>
        {noun} go here. Waiting on {waitingFor}.
      </p>
    </div>
  );
}
