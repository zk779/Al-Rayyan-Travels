import { useSearchParams } from "react-router-dom";

/** The ?search= text a header-search result sends you to ("" when there is none). */
export function useUrlSearch() {
  const [params] = useSearchParams();
  return params.get("search") || "";
}
