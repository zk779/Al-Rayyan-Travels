import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Modal,
  Button,
  Input,
  Form,
  Switch,
  message,
  Tag,
  Tooltip,
  Dropdown,
  Select,
  Segmented,
  Empty,
  Progress,
} from "antd";
import {
  Edit,
  Trash,
  Plus,
  Search,
  Plane,
  CheckCheck,
  XCircle,
  MoreVertical,
  RefreshCw,
  Globe,
  Copy,
  Lock,
  Hotel,
  ShieldCheck,
  X,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// The special records the Hotel and Insurance modules use as their "airline" (matched on icao_code).
// They are managed automatically: listed apart from the airlines and never editable here.
const SYSTEM_TYPES = {
  domesticHotel: { icon: Hotel, tone: "teal", label: "Domestic Hotel", note: "Hotel bookings inside KSA" },
  internationalHotel: { icon: Hotel, tone: "indigo", label: "International Hotel", note: "Hotel bookings abroad" },
  domesticInsurance: { icon: ShieldCheck, tone: "sky", label: "Domestic Insurance", note: "Insurance policies inside KSA" },
  internationalInsurance: { icon: ShieldCheck, tone: "violet", label: "International Insurance", note: "Insurance policies abroad" },
};
const isSystemType = (a) => !!SYSTEM_TYPES[a.icaoCode];

// literal class names (Tailwind can't see built-up strings)
const TONE = {
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
};

// small deterministic palette for the airline avatars
const AVATARS = [
  "from-sky-500 to-blue-600",
  "from-indigo-500 to-violet-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-fuchsia-500 to-purple-600",
  "from-cyan-500 to-sky-600",
  "from-lime-500 to-green-600",
];
const avatarOf = (s = "") => AVATARS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length];

// ======================== API Helper ========================
async function apiRequest(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.error || data?.message || "Request failed");
  }
  return data;
}

// ======================== Data Transformers ========================
const normalizeStatus = (status) => {
  if (typeof status === "boolean") return status;
  if (typeof status === "string") return status.toLowerCase() === "active";
  return true;
};

const toUi = (a) => ({
  id: a.id,
  code: a.airlineCode ?? a.code ?? "",
  iataName: a.iataName ?? "",
  name: a.airlineName ?? a.name ?? "",
  icaoCode: a.icao_code ?? "",
  country: a.country_territory ?? "",
  status: normalizeStatus(a.status),
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
});

const toPayload = (values) => ({
  airlineName: values.name?.trim(),
  iataName: values.iataName?.trim()?.toUpperCase(),
  airlineCode: values.code?.trim(),
  icao_code: values.icaoCode?.trim()?.toUpperCase(),
  country_territory: values.country?.trim(),
  status: !!values.status,
});

const copyText = async (text, label) => {
  try {
    await navigator.clipboard.writeText(String(text));
    message.success(`${label} ${text} copied`);
  } catch {
    message.error("Couldn't copy");
  }
};

// ======================== Main Component ========================
const AirlineCodesPage = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("AIRLINE_CREATE");
  const canEdit = hasPermission("AIRLINE_EDIT");
  const canDelete = hasPermission("AIRLINE_DELETE");

  const [allCodes, setAllCodes] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentCode, setCurrentCode] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  // the real airlines, and the Hotel / Insurance system types kept apart
  const airlineCodes = useMemo(() => allCodes.filter((a) => !isSystemType(a)), [allCodes]);
  const systemTypes = useMemo(
    () => Object.keys(SYSTEM_TYPES).map((k) => allCodes.find((a) => a.icaoCode === k)).filter(Boolean),
    [allCodes],
  );
  const setAirlineCodes = setAllCodes;

  // ======================== Fetch Airlines ========================
  const fetchAirlines = async (showLoader = true) => {
    if (showLoader) setLoadingList(true);
    else setRefreshing(true);

    try {
      const res = await apiRequest("/api/airlines");
      setAllCodes((res?.data || []).map(toUi));
      if (!showLoader) message.success("Data refreshed successfully!");
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAirlines();
  }, []);

  // ======================== Computed Values ========================
  const countries = useMemo(() => {
    const uniqueCountries = [...new Set(airlineCodes.map((a) => a.country))].filter(Boolean);
    return uniqueCountries.sort();
  }, [airlineCodes]);

  const filteredData = useMemo(() => {
    const q = searchText.toLowerCase();
    return airlineCodes.filter((c) => {
      const matchesSearch =
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.iataName || "").toLowerCase().includes(q) ||
        (c.icaoCode || "").toLowerCase().includes(q) ||
        (c.country || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.status) ||
        (statusFilter === "inactive" && !c.status);

      const matchesCountry = countryFilter === "all" || c.country === countryFilter;

      return matchesSearch && matchesStatus && matchesCountry;
    });
  }, [airlineCodes, searchText, statusFilter, countryFilter]);

  const stats = useMemo(() => {
    const total = airlineCodes.length;
    const active = airlineCodes.filter((x) => x.status).length;
    const inactive = total - active;
    const countriesCount = new Set(airlineCodes.map((a) => a.country).filter(Boolean)).size;
    const noIcao = airlineCodes.filter((a) => !a.icaoCode).length;
    return { total, active, inactive, countriesCount, noIcao };
  }, [airlineCodes]);

  // ======================== Modal Handlers ========================
  const showModal = (row = null) => {
    if (row && !canEdit) return; // RBAC guard
    if (!row && !canCreate) return;

    setIsModalOpen(true);
    setIsEditModal(!!row);
    setCurrentCode(row);

    form.setFieldsValue(
      row
        ? {
            code: row.code,
            iataName: row.iataName,
            name: row.name,
            icaoCode: row.icaoCode,
            country: row.country,
            status: row.status,
          }
        : { code: "", iataName: "", name: "", icaoCode: "", country: "", status: true },
    );
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsEditModal(false);
    setCurrentCode(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = toPayload(values);

      if (isEditModal && currentCode?.id) {
        const res = await apiRequest(`/api/airlines/${currentCode.id}`, { method: "PUT", body: payload });
        const updated = toUi(res?.data || {});
        setAirlineCodes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        message.success("Airline updated successfully!");
      } else {
        const res = await apiRequest("/api/airlines", { method: "POST", body: payload });
        const created = toUi(res?.data || {});
        setAirlineCodes((prev) => [created, ...prev]);
        message.success("Airline added successfully!");
      }

      handleCancel();
    } catch (e) {
      message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ======================== Delete Handlers ========================
  const handleDelete = (id) => {
    if (!canDelete) return;
    Modal.confirm({
      title: "Delete Airline",
      content: "Are you sure you want to delete this airline? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await apiRequest(`/api/airlines/${id}`, { method: "DELETE" });
          setAirlineCodes((prev) => prev.filter((x) => x.id !== id));
          setSelectedRowKeys((prev) => prev.filter((x) => x !== id));
          message.success("Airline deleted successfully!");
        } catch (e) {
          message.error(e.message);
        }
      },
    });
  };

  const handleDeleteSelected = () => {
    if (!canDelete) return;
    if (selectedRowKeys.length === 0) {
      message.warning("Please select airlines to delete");
      return;
    }

    Modal.confirm({
      title: `Delete ${selectedRowKeys.length} Airlines`,
      content: `Are you sure you want to delete ${selectedRowKeys.length} selected airline(s)? This action cannot be undone.`,
      okText: "Delete All",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await apiRequest("/api/airlines/deleteMany", { method: "DELETE", body: { ids: selectedRowKeys } });
          setAirlineCodes((prev) => prev.filter((x) => !selectedRowKeys.includes(x.id)));
          setSelectedRowKeys([]);
          message.success(`${selectedRowKeys.length} airline(s) deleted successfully!`);
        } catch (e) {
          message.error(e.message);
        }
      },
    });
  };

  // ======================== Status Handlers ========================
  const handleStatusToggle = async (record, checked) => {
    if (!canEdit) return;

    setAirlineCodes((prev) => prev.map((x) => (x.id === record.id ? { ...x, status: checked } : x))); // optimistic

    try {
      await apiRequest(`/api/airlines/${record.id}`, {
        method: "PUT",
        body: toPayload({ ...record, status: checked }),
      });
      message.success(`Status updated to ${checked ? "Active" : "Inactive"}`);
    } catch (e) {
      setAirlineCodes((prev) => prev.map((x) => (x.id === record.id ? { ...x, status: !checked } : x)));
      message.error(e.message);
    }
  };

  const handleBulkStatusChange = (targetStatus) => {
    if (!canEdit) return;
    if (selectedRowKeys.length === 0) {
      message.warning("Please select airlines to update");
      return;
    }

    Modal.confirm({
      title: `${targetStatus ? "Activate" : "Deactivate"} ${selectedRowKeys.length} Airlines`,
      content: `Are you sure you want to ${targetStatus ? "activate" : "deactivate"} ${selectedRowKeys.length} selected airline(s)?`,
      okText: targetStatus ? "Activate" : "Deactivate",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await apiRequest("/api/airlines/status/set-selected", {
            method: "PATCH",
            body: { ids: selectedRowKeys, targetStatus },
          });
          setAirlineCodes((prev) =>
            prev.map((x) => (selectedRowKeys.includes(x.id) ? { ...x, status: targetStatus } : x)),
          );
          setSelectedRowKeys([]);
          message.success(`${selectedRowKeys.length} airline(s) ${targetStatus ? "activated" : "deactivated"}!`);
        } catch (e) {
          message.error(e.message);
        }
      },
    });
  };

  // ======================== Table Actions Menu ========================
  const getActionsMenu = (record) => {
    const items = [
      {
        key: "copy",
        label: "Copy airline code",
        icon: <Copy className="w-4 h-4" />,
        onClick: () => copyText(record.code, "Code"),
      },
    ];

    if (canEdit) {
      items.push({ type: "divider" });
      items.push({
        key: "edit",
        label: "Edit",
        icon: <Edit className="w-4 h-4" />,
        onClick: () => showModal(record),
      });
      items.push({
        key: "toggle",
        label: record.status ? "Mark as Inactive" : "Mark as Active",
        icon: record.status ? <XCircle className="w-4 h-4" /> : <CheckCheck className="w-4 h-4" />,
        onClick: () => handleStatusToggle(record, !record.status),
      });
    }

    if (canDelete) {
      items.push({ type: "divider" });
      items.push({
        key: "delete",
        label: "Delete",
        danger: true,
        icon: <Trash className="w-4 h-4" />,
        onClick: () => handleDelete(record.id),
      });
    }

    return { items };
  };

  const hasAnyRowAction = canEdit || canDelete;

  // ======================== Table Columns ========================
  const columns = [
    {
      title: "Airline",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, r) => (
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-bold tracking-wide text-white shadow-sm ${avatarOf(r.iataName || r.name)}`}
          >
            {(r.iataName || name || "?").slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-800">{name}</div>
            <div className="truncate text-xs text-slate-400">
              {r.country ? r.country : "No country set"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 120,
      sorter: (a, b) => a.code.localeCompare(b.code),
      render: (code) => (
        <Tooltip title="Click to copy">
          <button
            type="button"
            onClick={() => copyText(code, "Code")}
            className="rounded-md bg-blue-50 px-2.5 py-1 font-mono text-xs font-semibold text-blue-700 ring-1 ring-blue-100 transition-colors hover:bg-blue-100"
          >
            {code}
          </button>
        </Tooltip>
      ),
    },
    {
      title: "IATA",
      dataIndex: "iataName",
      key: "iataName",
      width: 90,
      sorter: (a, b) => (a.iataName || "").localeCompare(b.iataName || ""),
      render: (iata) =>
        iata ? (
          <Tag color="cyan" className="m-0 font-mono">
            {iata}
          </Tag>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: "ICAO",
      dataIndex: "icaoCode",
      key: "icaoCode",
      width: 90,
      sorter: (a, b) => (a.icaoCode || "").localeCompare(b.icaoCode || ""),
      render: (icao) =>
        icao ? (
          <Tag color="purple" className="m-0 font-mono">
            {icao}
          </Tag>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      width: 170,
      sorter: (a, b) => (a.country || "").localeCompare(b.country || ""),
      render: (country) =>
        country ? (
          <div className="flex items-center gap-2 text-slate-600">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{country}</span>
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status, record) => (
        <Switch
          checked={status}
          onChange={(checked) => handleStatusToggle(record, checked)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          className={status ? "!bg-emerald-500" : ""}
          disabled={!canEdit}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      fixed: "right",
      width: 64,
      render: (_, record) => (
        <Dropdown menu={getActionsMenu(record)} trigger={["click"]}>
          <Button type="text" icon={<MoreVertical className="w-4 h-4" />} className="hover:bg-slate-100" />
        </Dropdown>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
  };

  // ======================== Bulk Actions Menu ========================
  const bulkActionsItems = [];
  if (canEdit) {
    bulkActionsItems.push(
      { key: "activate", label: "Activate Selected", icon: <CheckCheck className="w-4 h-4" />, onClick: () => handleBulkStatusChange(true) },
      { key: "deactivate", label: "Deactivate Selected", icon: <XCircle className="w-4 h-4" />, onClick: () => handleBulkStatusChange(false) },
    );
  }
  if (canDelete) {
    if (bulkActionsItems.length > 0) bulkActionsItems.push({ type: "divider" });
    bulkActionsItems.push({
      key: "delete",
      label: "Delete Selected",
      danger: true,
      icon: <Trash className="w-4 h-4" />,
      onClick: handleDeleteSelected,
    });
  }
  const bulkActionsMenu = { items: bulkActionsItems };

  // ======================== Clear Filters ========================
  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setCountryFilter("all");
  };
  const hasActiveFilters = searchText || statusFilter !== "all" || countryFilter !== "all";

  const activePct = stats.total ? Math.round((stats.active / stats.total) * 100) : 0;

  // ======================== Render ========================
  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto w-full space-y-5">
        {/* ========== Hero ========== */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-700 p-5 text-white shadow-lg sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-14 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-44 w-44 rounded-full bg-indigo-300/20 blur-2xl" />
          <Plane className="pointer-events-none absolute -bottom-6 right-24 h-36 w-36 rotate-12 text-white/10" strokeWidth={1.25} />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                <Plane className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Airline Management</h1>
                <p className="text-sm text-sky-50/90">Airline codes, IATA / ICAO identifiers and status in one place</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip title="Refresh data">
                <Button
                  icon={<RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />}
                  onClick={() => fetchAirlines(false)}
                  loading={refreshing}
                  size="large"
                  className="!border-white/30 !bg-white/15 !text-white hover:!bg-white/25"
                />
              </Tooltip>
              {canCreate && (
                <Button
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => showModal()}
                  size="large"
                  className="!border-0 !bg-white !font-semibold !text-blue-700 shadow-md hover:!bg-sky-50"
                >
                  Add Airline
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ========== Stats ========== */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total airlines", value: stats.total, icon: Plane, tile: "from-sky-500 to-blue-600", note: `${stats.noIcao} without an ICAO code` },
            { label: "Active", value: stats.active, icon: CheckCheck, tile: "from-emerald-500 to-teal-600", note: `${activePct}% of all airlines`, bar: activePct },
            { label: "Inactive", value: stats.inactive, icon: XCircle, tile: "from-rose-500 to-pink-600", note: "Hidden from new sales" },
            { label: "Countries", value: stats.countriesCount, icon: Globe, tile: "from-violet-500 to-purple-600", note: "Where they are based" },
          ].map(({ label, value, icon: Icon, tile, note, bar }) => (
            <div key={label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm ${tile}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-500">{label}</div>
                  <div className="text-2xl font-bold leading-tight text-slate-800">{value}</div>
                </div>
              </div>
              {bar != null ? (
                <Progress percent={bar} showInfo={false} size="small" strokeColor="#10b981" className="!mb-0 !mt-2" />
              ) : (
                <div className="mt-2 text-[11px] text-slate-400">{note}</div>
              )}
              {bar != null && <div className="text-[11px] text-slate-400">{note}</div>}
            </div>
          ))}
        </div>

        {/* ========== Hotel / Insurance system types ========== */}
        {systemTypes.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="mb-3 flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-slate-400" />
              <span className="font-semibold text-slate-700">Booking types</span>
              <span className="text-slate-400">
                Used by Hotel and Insurance bookings — managed automatically, not part of the airline list
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {systemTypes.map((t) => {
                const meta = SYSTEM_TYPES[t.icaoCode];
                const Icon = meta.icon;
                return (
                  <div key={t.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ${TONE[meta.tone]}`}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/80 shadow-sm">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{meta.label}</div>
                      <div className="truncate text-[11px] opacity-75">{meta.note}</div>
                    </div>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${t.status ? "bg-emerald-500" : "bg-slate-300"}`} title={t.status ? "Active" : "Inactive"} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== Table card ========== */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {/* toolbar */}
          <div className="space-y-3 border-b border-slate-100 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <Input
                placeholder="Search by code, name, IATA, ICAO or country…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<Search className="h-4 w-4 text-slate-400" />}
                allowClear
                size="large"
                className="flex-1"
              />
              <Segmented
                size="large"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: `All ${stats.total}`, value: "all" },
                  { label: `Active ${stats.active}`, value: "active" },
                  { label: `Inactive ${stats.inactive}`, value: "inactive" },
                ]}
              />
              <Select
                value={countryFilter}
                onChange={setCountryFilter}
                size="large"
                className="w-full lg:w-52"
                showSearch
                placeholder="Filter by country"
                options={[{ label: "All countries", value: "all" }, ...countries.map((c) => ({ label: c, value: c }))]}
              />
              {hasActiveFilters && (
                <Button onClick={clearFilters} size="large" icon={<X className="h-4 w-4" />}>
                  Clear
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                Showing <b className="text-slate-700">{filteredData.length}</b> of {stats.total} airlines
              </span>
              {stats.noIcao > 0 && (
                <span className="hidden items-center gap-1.5 text-xs text-amber-600 sm:flex">
                  <AlertTriangle className="h-3.5 w-3.5" /> {stats.noIcao} airlines have no ICAO code
                </span>
              )}
            </div>

            {/* bulk bar */}
            {selectedRowKeys.length > 0 && hasAnyRowAction && (
              <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
                <div className="flex items-center gap-2 font-medium text-blue-700">
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-blue-600 px-1.5 text-xs text-white">
                    {selectedRowKeys.length}
                  </span>
                  airline(s) selected
                </div>
                <div className="flex items-center gap-2">
                  <Button type="text" size="small" onClick={() => setSelectedRowKeys([])}>
                    Clear
                  </Button>
                  <Dropdown menu={bulkActionsMenu} trigger={["click"]}>
                    <Button type="primary" icon={<MoreVertical className="w-4 h-4" />}>
                      Bulk Actions
                    </Button>
                  </Dropdown>
                </div>
              </div>
            )}
          </div>

          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            loading={loadingList}
            rowSelection={hasAnyRowAction ? rowSelection : undefined}
            pagination={{
              pageSize: 20,
              showTotal: (total) => `Total ${total} airline(s)`,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              className: "!px-4",
            }}
            scroll={{ x: 900 }}
            locale={{
              emptyText: (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No airlines found">
                  {canCreate && (
                    <Button type="primary" onClick={() => showModal()}>
                      Add First Airline
                    </Button>
                  )}
                </Empty>
              ),
            }}
            rowClassName={(r) => (r.status ? "hover:bg-slate-50" : "bg-slate-50/60 text-slate-400 hover:bg-slate-50")}
          />
        </div>

        {/* ========== Add/Edit Modal ========== */}
        <Modal
          title={
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-2 text-white shadow-sm">
                <Plane className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold leading-tight">{isEditModal ? "Edit Airline" : "Add New Airline"}</div>
                <div className="text-xs font-normal text-slate-400">Codes are used across sales, refunds and reports</div>
              </div>
            </div>
          }
          open={isModalOpen}
          onCancel={handleCancel}
          footer={null}
          centered
          width={700}
          className="airline-modal"
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item
                label="Airline Code"
                name="code"
                rules={[
                  { required: true, message: "Please enter airline code" },
                  { pattern: /^\d+$/, message: "Code must be numeric" },
                ]}
              >
                <Input placeholder="e.g., 495" size="large" maxLength={10} />
              </Form.Item>

              <Form.Item
                label="IATA Code"
                name="iataName"
                rules={[
                  { required: true, message: "Please enter IATA code" },
                  { len: 2, message: "IATA code must be 2 characters" },
                ]}
              >
                <Input placeholder="e.g., L6" size="large" maxLength={2} className="uppercase" />
              </Form.Item>

              <Form.Item label="ICAO Code" name="icaoCode" rules={[{ len: 3, message: "ICAO code must be 3 characters" }]}>
                <Input placeholder="e.g., MAI" size="large" maxLength={3} className="uppercase" />
              </Form.Item>

              <Form.Item label="Country/Territory" name="country">
                <Input placeholder="e.g., Mauritania" size="large" />
              </Form.Item>
            </div>

            <Form.Item
              label="Airline Name"
              name="name"
              rules={[
                { required: true, message: "Please enter airline name" },
                { min: 3, message: "Name must be at least 3 characters" },
              ]}
            >
              <Input placeholder="e.g., Mauritania Airlines International" size="large" />
            </Form.Item>

            <Form.Item label="Status" name="status" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>

            <Form.Item className="mb-0 mt-6">
              <div className="flex justify-end gap-3">
                <Button onClick={handleCancel} size="large">
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={submitting} size="large" className="min-w-[120px]">
                  {isEditModal ? "Update" : "Create"}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default AirlineCodesPage;
