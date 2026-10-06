import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadContentStore,
  saveProgramField,
  saveRegistry as persistRegistry,
} from "../lib/content.js";
import {
  applyProgramField,
  applyRegistry,
  availablePrograms,
  currentProgram,
} from "../data/index.js";
import { ContentContext } from "./content-context.js";

export default function ContentProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const { programs, registry } = await loadContentStore();
      if (cancelled) return;

      // Re-apply every saved program field on top of the bundled JSON…
      for (const [programId, fields] of Object.entries(programs)) {
        for (const [field, data] of Object.entries(fields)) {
          if (data !== undefined) applyProgramField(programId, field, data);
        }
      }
      // …then reconcile the registry (switches active program, which re-applies
      // that program's overrides on top of whatever is now bundled).
      if (registry) applyRegistry(registry);
      setHydrated(true);
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveField = useCallback(async (programId, field, data) => {
    applyProgramField(programId, field, data);
    const { error } = await saveProgramField(programId, field, data);
    return { error };
  }, []);

  const saveRegistry = useCallback(async (registry) => {
    applyRegistry(registry);
    const { error } = await persistRegistry(registry);
    return { error };
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      programs: availablePrograms,
      activeProgramId: currentProgram.id,
      saveField,
      saveRegistry,
    }),
    [hydrated, saveField, saveRegistry]
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}