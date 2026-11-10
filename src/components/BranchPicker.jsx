"use client";

import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Building2 } from "lucide-react";
import { Label } from "../../shadcn/components/ui/label";
import { useIsAdmin } from "../utils/useIsAdmin";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const styles = {
  control: (b, s) => ({
    ...b,
    minHeight: 40,
    borderRadius: 8,
    boxShadow: s.isFocused ? "0 0 0 3px rgba(100,116,139,0.18)" : "none",
    borderColor: s.isFocused ? "#64748b" : b.borderColor,
    fontSize: "14px",
  }),
  menuPortal: (b) => ({ ...b, zIndex: 9999 }),
};

/**
 * Which branch a sale belongs to — ADMIN ONLY (renders nothing for anyone else).
 *   allowDefault: new sales leave it empty to use the creator's own branch; an existing sale
 *                 always has a branch, so there it must be picked.
 */
export default function BranchPicker({ value, onChange, label = "Branch", allowDefault = true, className = "" }) {
  const isAdmin = useIsAdmin();
  const [branches, setBranches] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!isAdmin) return undefined;
    const controller = new AbortController();
    fetch(`${API_BASE}/api/branches`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then((r) => r.json())
      .then((j) => setBranches(j.data || []))
      .catch(() => {});
    return () => controller.abort();
  }, [isAdmin, token]);

  const options = useMemo(() => branches.map((b) => ({ value: b.id, label: `${b.name} (${b.code})` })), [branches]);
  if (!isAdmin) return null;

  return (
    <div className={`space-y-2 ${className}`} data-testid="branch-picker">
      <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        <Building2 className="h-3.5 w-3.5 text-indigo-500" /> {label}
        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">Admin</span>
      </Label>
      <Select
        options={options}
        value={options.find((o) => o.value === value) || null}
        onChange={(o) => onChange(o?.value || "")}
        isClearable={allowDefault}
        placeholder={allowDefault ? "My branch (default)" : "Select branch"}
        menuPortalTarget={document.body}
        styles={styles}
        aria-label={label}
      />
    </div>
  );
}
