export const money = (v) =>
  `SAR ${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const compact = (v) =>
  Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

// Browser's IANA timezone, e.g. "Asia/Karachi" — sent to the API so day
// boundaries (dateFrom/dateTo) are resolved against the user's local day,
// not UTC.
export const getLocalTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

export const toCsv = (headers, rows) =>
  [headers, ...rows]
    .map((r) => r.map((v) => `"${v ?? ""}"`).join(","))
    .join("\n");

export const downloadCsv = (filename, headers, rows) => {
  const csv = toCsv(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};