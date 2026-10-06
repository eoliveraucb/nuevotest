import { useMemo, useState } from "react";

/**
 * Draft state + save button plumbing shared by the /admin editors.
 */
export default function useDraft(initFactory, onSave) {
  const init = useMemo(initFactory, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [draft, setDraft] = useState(init);
  const [status, setStatus] = useState("idle");

  const dirty = JSON.stringify(draft) !== JSON.stringify(init);

  const save = async () => {
    setStatus("saving");
    const { error } = await onSave(draft);
    setStatus(error ? "error" : "saved");
  };

  const reset = () => {
    setDraft(init);
    setStatus("idle");
  };

  return { draft, setDraft, status, dirty, save, reset };
}