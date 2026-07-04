import { useState } from "react";
import { useNavigate } from "react-router-dom";

/** Header search — on submit, navigates to the registry filtered by the query. */
export function NavSearch() {
  const [v, setV] = useState("");
  const navigate = useNavigate();

  return (
    <form
      className="app-search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/?q=${encodeURIComponent(v.trim())}#registry`);
      }}
    >
      <span aria-hidden>⌕</span>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Search token or wrapper"
        aria-label="Search tokens"
      />
      <kbd>↵</kbd>
    </form>
  );
}
