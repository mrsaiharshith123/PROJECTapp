import { useCallback, useEffect, useState } from "react";
import { fetchAdminUsers } from "../services/adminUsers.js";

const PAGE_SIZE = 25;

/**
 * @returns {{
 *   users: Record<string, unknown>[],
 *   total: number,
 *   offset: number,
 *   limit: number,
 *   search: string,
 *   setSearch: (q: string) => void,
 *   loading: boolean,
 *   error: string | null,
 *   refresh: () => void,
 *   nextPage: () => void,
 *   prevPage: () => void,
 *   runSearch: () => void,
 * }}
 */
export function useAdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    setTick((n) => n + 1);
  }, []);

  const runSearch = useCallback(() => {
    setOffset(0);
    setQuery(search.trim());
    refresh();
  }, [search, refresh]);

  const nextPage = useCallback(() => {
    setOffset((o) => o + PAGE_SIZE);
    refresh();
  }, [refresh]);

  const prevPage = useCallback(() => {
    setOffset((o) => Math.max(0, o - PAGE_SIZE));
    refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;

    fetchAdminUsers({ search: query, limit: PAGE_SIZE, offset })
      .then((result) => {
        if (cancelled) return;
        setUsers(result.users);
        setTotal(result.total);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setUsers([]);
        setError(e?.code === "NOT_ADMIN" ? "NOT_ADMIN" : e?.message || "Failed to load users");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, offset, tick]);

  return {
    users,
    total,
    offset,
    limit: PAGE_SIZE,
    search,
    setSearch,
    loading,
    error,
    refresh,
    nextPage,
    prevPage,
    runSearch,
  };
}
