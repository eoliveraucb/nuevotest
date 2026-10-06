import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scrolls to top on route change (but not on same-page hash links). */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [pathname, hash]);

  return null;
}
