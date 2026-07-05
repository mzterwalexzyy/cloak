import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistryPairs } from "../hooks/useRegistryPairs";
import { displaySym } from "../lib/format";

export function NavSearch() {
  const [v, setV] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data } = useRegistryPairs();
  const wrapRef = useRef<HTMLDivElement>(null);

  const pairs = data?.items ?? [];
  const q = v.trim().toLowerCase();
  const suggestions = q.length < 1 ? [] : pairs
    .filter((p) => {
      const u = displaySym(p.underlying.symbol).toLowerCase();
      const c = displaySym(p.confidential.symbol).toLowerCase();
      const name = (p.underlying.name ?? "").toLowerCase();
      return u.includes(q) || c.includes(q) || name.includes(q);
    })
    .slice(0, 6);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  return (
    <div className="app-search-wrap" ref={wrapRef}>
      <form
        className="app-search"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          navigate(`/?q=${encodeURIComponent(v.trim())}#registry`);
        }}
      >
        <span aria-hidden>⌕</span>
        <input
          value={v}
          onChange={(e) => { setV(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search token or wrapper"
          aria-label="Search tokens"
        />
        <kbd>↵</kbd>
      </form>

      {open && suggestions.length > 0 && (
        <div className="search-dropdown">
          {suggestions.map((p) => (
            <button
              key={p.confidentialTokenAddress}
              className="search-suggestion"
              onMouseDown={(e) => {
                e.preventDefault();
                setV("");
                setOpen(false);
                navigate(`/pair/${p.confidentialTokenAddress}`);
              }}
            >
              <span className="ss-sym">{displaySym(p.underlying.symbol)}</span>
              <span className="ss-arr">→</span>
              <span className="ss-csym">{displaySym(p.confidential.symbol)}</span>
              <span className="ss-name muted">{p.underlying.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
