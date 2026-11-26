import React, { useEffect, useMemo, useState } from "react";
import { useUrlSearch } from "../utils/useUrlSearch";
import {
  Table,
  Modal,
  Button,
  Input,
  Form,
  Switch,
  Select,
  DatePicker,
  Segmented,
  Tooltip,
  Empty,
  Progress,
} from "antd";
import dayjs from "dayjs";
import {
  Edit,
  Trash,
  Plus,
  Search,
  Store,
  TrendingUp,
  CheckCircle,
  TrendingDown,
  SaudiRiyal,
  Phone,
  Mail,
  MapPin,
  UserRound,
  RefreshCw,
  X,
  Copy,
} from "lucide-react";

// Components & Utils
import CustomAlertDialog from "../components/CustomAlertDialog";
import { appToast } from "../../shadcn/components/ui/appToast";
import { useAuth } from "../context/AuthContext"; // ✅ ADD THIS
import { cn } from "../../shadcn/lib/utils";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ======================= API ======================= */
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
  if (!res.ok || data?.success === false)
    throw new Error(data?.error || data?.message || "Request failed");
  return data;
}

/* ======================= ADDRESS HELPERS ======================= */
function packAddress(location = "", contactPerson = "") {
  const loc = String(location || "").trim();
  const cp = String(contactPerson || "").trim();
  if (!cp) return loc || null;
  return [loc, `Contact Person: ${cp}`].filter(Boolean).join("\n");
}
function unpackAddress(address = "") {
  const str = String(address || "");
  const lines = str
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  const cpLineIdx = lines.findIndex((l) =>
    l.toLowerCase().startsWith("contact person:"),
  );
  const contactPerson =
    cpLineIdx >= 0 ? lines[cpLineIdx].split(":").slice(1).join(":").trim() : "";
  const location =
    cpLineIdx >= 0 ? lines.slice(0, cpLineIdx).join(", ") : lines.join(", ");
  return { location, contactPerson };
}

/* ======================= DISPLAY HELPERS ======================= */
const fmt = (n) =>
  Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// literal class names (Tailwind can't see built-up strings)
const TYPE_TONE = {
  Airline: "bg-sky-50 text-sky-700 ring-sky-200",
  Hotel: "bg-teal-50 text-teal-700 ring-teal-200",
  Transport: "bg-amber-50 text-amber-700 ring-amber-200",
  "Tour Operator": "bg-violet-50 text-violet-700 ring-violet-200",
  Other: "bg-slate-100 text-slate-600 ring-slate-200",
};
const AVATARS = [
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-indigo-500 to-violet-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-fuchsia-500 to-purple-600",
  "from-cyan-500 to-sky-600",
  "from-lime-500 to-green-600",
];
const avatarOf = (s = "") => AVATARS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length];
const initials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase() || "?";

const SORTS = [
  { value: "vendorDate:desc", label: "Vendor date · newest first" },
  { value: "vendorDate:asc", label: "Vendor date · oldest first" },
  { value: "createdAt:desc", label: "Added · newest first" },
  { value: "createdAt:asc", label: "Added · oldest first" },
];


const VendorsPage = () => {
  // ✅ RBAC — permission flags
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("VENDOR_CREATE");
  const canEdit = hasPermission("VENDOR_EDIT");
  const canDelete = hasPermission("VENDOR_DELETE");
  const hasAnyRowAction = canEdit || canDelete;

  const [vendors, setVendors] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [sortKey, setSortKey] = useState("vendorDate:desc");
  const [orderBy, orderDir] = sortKey.split(":");
  const [typeFilter, setTypeFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [saving, setSaving] = useState(false);
  const urlSearch = useUrlSearch(); // arrives from the header search
  const [searchText, setSearchText] = useState(urlSearch);
  useEffect(() => {
    if (urlSearch) setSearchText(urlSearch);
  }, [urlSearch]);
  const [, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();

  const normalizeVendor = (v) => {
    const { location, contactPerson } = unpackAddress(v?.address);
    return {
      id: v.id,
      name: v.vendorName,
      type: v.vendorType,
      contactPerson,
      contact: v.phone,
      email: v.email,
      location,
      openingBalance: Number(v.openingBalance || 0),
      currentBalance: Number(v.account?.balance || 0),
      status: v.status,
      vendorDate: v.vendorDate,
      _category: v.category,
    };
  };

  const refreshVendors = async () => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams({ orderBy, orderDir });
      const res = await apiRequest(`/api/vendors?${params.toString()}`);
      setVendors((res.data || []).map(normalizeVendor));
    } catch (e) {
      appToast.error(e.message || "Failed to fetch vendors");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    refreshVendors();
  }, [orderBy, orderDir]);

  const vendorTypes = useMemo(
    () => [...new Set(vendors.map((v) => v.type).filter(Boolean))].sort(),
    [vendors],
  );

  const filteredData = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return vendors.filter((v) => {
      const matchesSearch =
        !q ||
        [v.name, v.contactPerson, v.contact, v.email, v.location, v.type].some((x) =>
          String(x || "").toLowerCase().includes(q),
        );
      const matchesType = typeFilter === "all" || v.type === typeFilter;
      const matchesBalance =
        balanceFilter === "all" || (balanceFilter === "DEBIT" ? v._category === "DEBIT" : v._category !== "DEBIT");
      const matchesStatus =
        statusFilter === "all" || (statusFilter === "active" ? v.status : !v.status);
      return matchesSearch && matchesType && matchesBalance && matchesStatus;
    });
  }, [vendors, searchText, typeFilter, balanceFilter, statusFilter]);

  const totals = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter((v) => v.status).length;
    const debit = vendors.filter((v) => v._category === "DEBIT");
    const credit = vendors.filter((v) => v._category !== "DEBIT");
    return {
      total,
      active,
      inactive: total - active,
      payables: debit.reduce((s, v) => s + v.currentBalance, 0),
      payableCount: debit.length,
      receivables: credit.reduce((s, v) => s + v.currentBalance, 0),
      receivableCount: credit.length,
    };
  }, [vendors]);

  const hasActiveFilters =
    searchText || typeFilter !== "all" || balanceFilter !== "all" || statusFilter !== "all";
  const clearFilters = () => {
    setSearchText("");
    setTypeFilter("all");
    setBalanceFilter("all");
    setStatusFilter("all");
  };
  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(String(text));
      appToast.success(`${label} copied`);
    } catch {
      appToast.error("Couldn't copy");
    }
  };

  const showModal = (vendor = null) => {
    // ✅ RBAC guard
    if (vendor && !canEdit) return;
    if (!vendor && !canCreate) return;

    setIsModalOpen(true);
    setIsEditModal(!!vendor);
    setCurrentVendor(vendor);
    form.setFieldsValue(
      vendor
        ? {
            name: vendor.name,
            type: vendor.type,
            contactPerson: vendor.contactPerson,
            contact: vendor.contact,
            email: vendor.email,
            location: vendor.location,
            openingBalance: vendor.openingBalance,
            balanceType:
              vendor._category === "DEBIT" ? "Debit (DR)" : "Credit (CR)",
            vendorDate: vendor.vendorDate ? dayjs(vendor.vendorDate) : dayjs(),
            status: vendor.status,
          }
        : {
            openingBalance: 0,
            balanceType: "Credit (CR)",
            vendorDate: dayjs(),
            status: true,
          },
    );
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsEditModal(false);
    setCurrentVendor(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    // ✅ RBAC guard
    if (isEditModal && !canEdit) return;
    if (!isEditModal && !canCreate) return;

    setSaving(true);
    try {
      const payload = {
        vendorName: values.name,
        vendorType: values.type,
        phone: values.contact,
        email: values.email,
        address: packAddress(values.location, values.contactPerson),
        openingBalance: Number(values.openingBalance),
        category: values.balanceType.includes("Debit") ? "DEBIT" : "CREDIT",
        vendorDate: values.vendorDate.toISOString(),
        status: values.status,
      };

      if (isEditModal) {
        await apiRequest(`/api/vendors/${currentVendor.id}`, {
          method: "PUT",
          body: payload,
        });
        appToast.success("Vendor updated successfully!");
      } else {
        await apiRequest("/api/vendors", { method: "POST", body: payload });
        appToast.success("Vendor added successfully!");
      }
      handleCancel();
      refreshVendors();
    } catch (e) {
      appToast.error(e.message || "Failed to save vendor");
    } finally {
      setSaving(false);
    }
  };

  /* ======================= DELETE LOGIC ======================= */
  const handleConfirmDelete = async () => {
    if (!canDelete) return; // ✅ RBAC guard
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      // Bulk delete or single delete?
      if (Array.isArray(deleteTarget)) {
        await Promise.all(
          deleteTarget.map((id) =>
            apiRequest(`/api/vendors/${id}`, { method: "DELETE" }),
          ),
        );
        appToast.success("Selected vendors processed successfully");
        setSelectedRowKeys([]);
      } else {
        const res = await apiRequest(`/api/vendors/${deleteTarget.id}`, {
          method: "DELETE",
        });
        appToast.success(res.message || "Vendor processed successfully");
        setSelectedRowKeys((prev) => prev.filter((x) => x !== deleteTarget.id));
      }
      refreshVendors();
      setDeleteTarget(null);
    } catch (e) {
      appToast.error(e.message || "Failed to delete vendor(s)");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (id, checked) => {
    if (!canEdit) return; // ✅ RBAC guard — status toggle is an edit action

    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: checked } : v)),
    );
    try {
      await apiRequest(`/api/vendors/${id}`, {
        method: "PUT",
        body: { status: checked },
      });
      appToast.success(`Vendor ${checked ? "Activated" : "Deactivated"}`);
    } catch (e) {
      setVendors((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: !checked } : v)),
      );
      appToast.error(e.message || "Failed to update status");
    }
  };

  const columns = [
    {
      title: "Vendor",
      key: "vendorDetails",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, record) => (
        <div className="flex min-w-[200px] items-center gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm ${avatarOf(record.name)}`}
          >
            {initials(record.name)}
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-800">{record.name}</div>
            <div className="flex items-center gap-1 truncate text-xs text-slate-400">
              <UserRound className="h-3 w-3 shrink-0" />
              {record.contactPerson || "No contact person"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 130,
      sorter: (a, b) => String(a.type || "").localeCompare(String(b.type || "")),
      render: (type) =>
        type ? (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${TYPE_TONE[type] || TYPE_TONE.Other}`}
          >
            {type}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: "Contact",
      key: "contactInfo",
      render: (_, record) => (
        <div className="min-w-[210px] space-y-0.5 text-sm text-slate-600">
          {record.contact && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{record.contact}</span>
              <Tooltip title="Copy phone">
                <button
                  type="button"
                  onClick={() => copyText(record.contact, "Phone")}
                  className="text-slate-300 transition-colors hover:text-sky-600"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </Tooltip>
            </div>
          )}
          {record.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{record.email}</span>
            </div>
          )}
          {record.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{record.location}</span>
            </div>
          )}
          {!record.contact && !record.email && !record.location && <span className="text-slate-300">—</span>}
        </div>
      ),
    },
    {
      title: "Opening Balance",
      dataIndex: "openingBalance",
      key: "openingBalance",
      align: "right",
      sorter: (a, b) => a.openingBalance - b.openingBalance,
      render: (value) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-slate-600">
          <SaudiRiyal size={13} className="text-slate-400" />
          {fmt(value)}
        </span>
      ),
    },
    {
      title: "Balance Type",
      dataIndex: "_category",
      key: "_category",
      width: 130,
      render: (value) =>
        value === "DEBIT" ? (
          <span className="inline-flex rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
            Debit (DR)
          </span>
        ) : value === "CREDIT" ? (
          <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Credit (CR)
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: "Current Balance",
      dataIndex: "currentBalance",
      key: "currentBalance",
      align: "right",
      sorter: (a, b) => a.currentBalance - b.currentBalance,
      render: (value, record) => {
        const n = Number(value || 0);
        const tag = record._category === "DEBIT" ? "DR" : "CR";
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-semibold tabular-nums",
              n >= 0 ? "text-emerald-600" : "text-rose-600",
            )}
          >
            <SaudiRiyal size={13} />
            {fmt(n)}
            <span className="text-[10px] font-medium opacity-70">{tag}</span>
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status, record) => (
        <Switch
          checked={!!status}
          onChange={(checked) => handleStatusToggle(record.id, checked)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          className={status ? "!bg-emerald-500" : ""}
          disabled={!canEdit} // ✅ RBAC
        />
      ),
    },
    // ✅ RBAC — only add Actions column if user can do anything
    ...(hasAnyRowAction
      ? [
          {
            title: "",
            key: "actions",
            fixed: "right",
            width: 92,
            render: (_, record) => (
              <div className="flex items-center justify-end gap-1">
                {canEdit && (
                  <Tooltip title="Edit">
                    <Button
                      type="text"
                      icon={<Edit className="h-4 w-4" />}
                      className="!text-sky-600 hover:!bg-sky-50"
                      onClick={() => showModal(record)}
                    />
                  </Tooltip>
                )}
                {canDelete && (
                  <Tooltip title="Remove">
                    <Button
                      type="text"
                      icon={<Trash className="h-4 w-4" />}
                      className="!text-rose-500 hover:!bg-rose-50"
                      onClick={() => setDeleteTarget(record)}
                    />
                  </Tooltip>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const activePct = totals.total ? Math.round((totals.active / totals.total) * 100) : 0;

  return (
    <div className="min-h-screen space-y-5 p-4 sm:p-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-700 p-5 text-white shadow-lg sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-14 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-44 w-44 rounded-full bg-cyan-300/20 blur-2xl" />
        <Store className="pointer-events-none absolute -bottom-6 right-24 h-36 w-36 rotate-6 text-white/10" strokeWidth={1.25} />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/30">
              <Store className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
              <p className="text-sm text-emerald-50/90">
                Suppliers, their contacts and what you owe or are owed — all in one list
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip title="Refresh">
              <Button
                icon={<RefreshCw className={`h-4 w-4 ${loadingList ? "animate-spin" : ""}`} />}
                onClick={refreshVendors}
                size="large"
                className="!border-white/30 !bg-white/15 !text-white hover:!bg-white/25"
              />
            </Tooltip>
            {/* ✅ RBAC — hide "Add Vendor" if no create permission */}
            {canCreate && (
              <Button
                icon={<Plus className="h-4 w-4" />}
                onClick={() => showModal()}
                size="large"
                className="!border-0 !bg-white !font-semibold !text-teal-700 shadow-md hover:!bg-emerald-50"
              >
                Add Vendor
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            title: "Total Vendors",
            value: totals.total,
            note: `${totals.active} active · ${totals.inactive} inactive`,
            icon: Store,
            tile: "from-sky-500 to-blue-600",
          },
          {
            title: "Total Payables",
            value: fmt(totals.payables),
            suffix: "DR",
            money: true,
            note: `${totals.payableCount} debit vendor(s)`,
            icon: TrendingDown,
            tile: "from-rose-500 to-pink-600",
          },
          {
            title: "Total Receivables",
            value: fmt(totals.receivables),
            suffix: "CR",
            money: true,
            note: `${totals.receivableCount} credit vendor(s)`,
            icon: TrendingUp,
            tile: "from-emerald-500 to-teal-600",
          },
          {
            title: "Active Vendors",
            value: totals.active,
            note: `${activePct}% of all vendors`,
            bar: activePct,
            icon: CheckCircle,
            tile: "from-violet-500 to-purple-600",
          },
        ].map(({ title, value, suffix, money, note, bar, icon: Icon, tile }) => (
          <div key={title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm ${tile}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">{title}</div>
                <div className="flex items-center gap-1 truncate text-2xl font-bold leading-tight text-slate-800">
                  {money && <SaudiRiyal size={18} className="text-slate-400" />}
                  {value}
                  {suffix && <span className="text-xs font-semibold text-slate-400">{suffix}</span>}
                </div>
              </div>
            </div>
            {bar != null && <Progress percent={bar} showInfo={false} size="small" strokeColor="#8b5cf6" className="!mb-0 !mt-2" />}
            <div className={`text-[11px] text-slate-400 ${bar != null ? "" : "mt-2"}`}>{note}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="space-y-3 border-b border-slate-100 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <Input
              placeholder="Search by name, contact person, phone, email or address…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<Search className="h-4 w-4 text-slate-400" />}
              allowClear
              size="large"
              className="flex-1"
            />
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              size="large"
              className="w-full xl:w-44"
              options={[{ label: "All types", value: "all" }, ...vendorTypes.map((t) => ({ label: t, value: t }))]}
            />
            <Select value={sortKey} onChange={setSortKey} size="large" className="w-full xl:w-56" options={SORTS} />
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                value={balanceFilter}
                onChange={setBalanceFilter}
                options={[
                  { label: "All balances", value: "all" },
                  { label: "Debit (DR)", value: "DEBIT" },
                  { label: "Credit (CR)", value: "CREDIT" },
                ]}
              />
              <Segmented
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: `All ${totals.total}`, value: "all" },
                  { label: `Active ${totals.active}`, value: "active" },
                  { label: `Inactive ${totals.inactive}`, value: "inactive" },
                ]}
              />
              {hasActiveFilters && (
                <Button onClick={clearFilters} icon={<X className="h-4 w-4" />}>
                  Clear
                </Button>
              )}
            </div>
            <span className="text-sm text-slate-500">
              Showing <b className="text-slate-700">{filteredData.length}</b> of {totals.total} vendors
            </span>
          </div>
        </div>

        <Table
          loading={loadingList}
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"], className: "!px-4" }}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No vendors found">
                {canCreate && !hasActiveFilters && (
                  <Button type="primary" onClick={() => showModal()}>
                    Add First Vendor
                  </Button>
                )}
              </Empty>
            ),
          }}
          rowClassName={(r) => (r.status ? "hover:bg-slate-50" : "bg-slate-50/60 text-slate-400 hover:bg-slate-50")}
        />
      </div>

      {/* ✅ RBAC — only mount delete dialog if user can delete */}
      {canDelete && (
        <CustomAlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
          title={
            Array.isArray(deleteTarget)
              ? "Delete Selected Vendors?"
              : "Remove Vendor?"
          }
          description={
            Array.isArray(deleteTarget)
              ? `You are about to delete ${deleteTarget.length} vendors. If they have transaction history, they will be deactivated instead of removed.`
              : `Are you sure you want to remove "${deleteTarget?.name}"? If they have existing ledger entries, they will be safely deactivated.`
          }
          onConfirm={handleConfirmDelete}
          loading={isDeleting}
          variant="danger"
          confirmText="Confirm Action"
        />
      )}

      <Modal
        title={
          <div className="flex items-center gap-3 border-b pb-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <div className="text-lg font-semibold leading-tight">{isEditModal ? "Edit Vendor" : "Add New Vendor"}</div>
              <div className="text-xs font-normal text-slate-400">Contact details and the opening balance with this vendor</div>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={820}
        style={{ top: 16 }}
        bodyStyle={{ maxHeight: "75vh", overflow: "auto" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-0">
            <Form.Item
              label="Vendor Name *"
              name="name"
              rules={[{ required: true, message: "Enter vendor name!" }]}
            >
              <Input placeholder="Enter vendor name" />
            </Form.Item>

            <Form.Item
              label="Vendor Type *"
              name="type"
              rules={[{ required: true, message: "Select vendor type!" }]}
            >
              <Select placeholder="Select vendor type">
                <Select.Option value="Airline">Airline</Select.Option>
                <Select.Option value="Hotel">Hotel</Select.Option>
                <Select.Option value="Transport">Transport</Select.Option>
                <Select.Option value="Tour Operator">
                  Tour Operator
                </Select.Option>
                <Select.Option value="Other">Other</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-0">
            <Form.Item
              label="Contact Person *"
              name="contactPerson"
              rules={[{ required: true, message: "Enter contact person!" }]}
            >
              <Input placeholder="Enter contact person name" />
            </Form.Item>

            <Form.Item
              label="Phone *"
              name="contact"
              rules={[{ required: true, message: "Enter phone number!" }]}
            >
              <Input placeholder="Enter phone number" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-0">
            <Form.Item
              label="Email "
              name="email"
              rules={[{ type: "email", message: "Enter a valid email address" }]}
            >
              <Input placeholder="Enter email address" />
            </Form.Item>

            <Form.Item
              label="Address"
              name="location"
              rules={[{ required: false, message: "Enter address!" }]}
            >
              <Input placeholder="Enter address" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Opening Balance"
              name="openingBalance"
              rules={[{ required: true, message: "Enter opening balance!" }]}
              extra={isEditModal ? "Can't be changed once the vendor has transactions" : undefined}
            >
              <Input type="number" placeholder="0.00" />
            </Form.Item>

            <Form.Item
              label="Balance Type"
              name="balanceType"
              rules={[{ required: true, message: "Select balance type!" }]}
            >
              <Select placeholder="Credit (CR)">
                <Select.Option value="Credit (CR)">Credit (CR)</Select.Option>
                <Select.Option value="Debit (DR)">Debit (DR)</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Vendor Date" name="vendorDate" required>
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item label="Status" name="status" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
            <Button
              onClick={handleCancel}
              className="bg-gray-200 text-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Save Vendor
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default VendorsPage;
