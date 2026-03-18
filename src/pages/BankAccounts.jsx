import React, { useEffect, useMemo, useState } from "react";
import {
  Table, Modal, Button, Input, Form, Switch, Space, Select, DatePicker,
} from "antd";
import dayjs from "dayjs";
import { Edit, Trash, Plus, Search, Landmark, Wallet, CheckCircle, DollarSign } from "lucide-react";
import CustomAlertDialog from "../components/CustomAlertDialog";
import { appToast } from "../../shadcn/components/ui/appToast";

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

/* ======================= NORMALIZE ======================= */
const normalizeBank = (b) => ({
  id:             b.id,
  bankName:       b.bankName,
  accountNumber:  b.accountNumber,
  branchName:     b.branchName  || "",
  swiftCode:      b.swiftCode   || "",
  openingBalance: Number(b.openingBalance  || 0),
  currentBalance: Number(b.account?.balance || 0),
  isActive:       b.isActive,
  bankDate:       b.bankDate,
});

/* ======================= PAGE ======================= */
const BankAccountsPage = () => {
  const [banks,       setBanks]       = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [orderBy,     setOrderBy]     = useState("bankDate");
  const [orderDir,    setOrderDir]    = useState("desc");
  const [searchText,  setSearchText]  = useState("");

  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [isEditModal,  setIsEditModal]  = useState(false);
  const [currentBank,  setCurrentBank]  = useState(null);
  const [saving,       setSaving]       = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting,   setIsDeleting]   = useState(false);

  const [form] = Form.useForm();

  /* ── Fetch ── */
  const refreshBanks = async () => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams({ orderBy, orderDir });
      const res = await apiRequest(`/api/banks?${params.toString()}`);
      setBanks((res.data || []).map(normalizeBank));
    } catch (e) {
      appToast.error("Fetch Error", e.message || "Failed to fetch bank accounts");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { refreshBanks(); }, [orderBy, orderDir]);

  /* ── Filter ── */
  const filteredData = useMemo(() => {
    const q = searchText.toLowerCase();
    if (!q) return banks;
    return banks.filter(
      (b) =>
        b.bankName.toLowerCase().includes(q) ||
        b.accountNumber.toLowerCase().includes(q) ||
        b.branchName.toLowerCase().includes(q)
    );
  }, [banks, searchText]);

  /* ── Stats ── */
  const totals = useMemo(() => ({
    total:   banks.length,
    active:  banks.filter((b) => b.isActive).length,
    totalBalance: banks.reduce((s, b) => s + b.currentBalance, 0),
    totalOpening: banks.reduce((s, b) => s + b.openingBalance, 0),
  }), [banks]);

  /* ── Modal ── */
  const showModal = (bank = null) => {
    setIsModalOpen(true);
    setIsEditModal(!!bank);
    setCurrentBank(bank);
    form.setFieldsValue(
      bank
        ? {
            bankName:      bank.bankName,
            accountNumber: bank.accountNumber,
            branchName:    bank.branchName,
            swiftCode:     bank.swiftCode,
            openingBalance: bank.openingBalance,
            bankDate:      bank.bankDate ? dayjs(bank.bankDate) : dayjs(),
            isActive:      bank.isActive,
          }
        : { openingBalance: 0, bankDate: dayjs(), isActive: true }
    );
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsEditModal(false);
    setCurrentBank(null);
    form.resetFields();
  };

  /* ── Save ── */
  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        bankName:      values.bankName,
        accountNumber: values.accountNumber,
        branchName:    values.branchName   || null,
        swiftCode:     values.swiftCode    || null,
        openingBalance: Number(values.openingBalance || 0),
        bankDate:      values.bankDate.toISOString(),
        isActive:      values.isActive,
      };

      if (isEditModal) {
        await apiRequest(`/api/banks/${currentBank.id}`, { method: "PUT", body: payload });
        appToast.success("Bank Updated", "Bank account updated successfully!");
      } else {
        await apiRequest("/api/banks", { method: "POST", body: payload });
        appToast.success("Bank Added", "Bank account added successfully!");
      }
      handleCancel();
      refreshBanks();
    } catch (e) {
      appToast.error("Save Error", e.message || "Failed to save bank account");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await apiRequest(`/api/banks/${deleteTarget.id}`, { method: "DELETE" });
      appToast.success("Done", res.message || "Bank processed successfully");
      setDeleteTarget(null);
      refreshBanks();
    } catch (e) {
      appToast.error("Delete Error", e.message || "Failed to delete bank account");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── Status toggle ── */
  const handleStatusToggle = async (id, checked) => {
    setBanks((prev) => prev.map((b) => (b.id === id ? { ...b, isActive: checked } : b)));
    try {
      await apiRequest(`/api/banks/${id}`, { method: "PUT", body: { isActive: checked } });
      appToast.success("Status Updated", `Bank ${checked ? "activated" : "deactivated"}`);
    } catch (e) {
      setBanks((prev) => prev.map((b) => (b.id === id ? { ...b, isActive: !checked } : b)));
      appToast.error("Error", e.message || "Failed to update status");
    }
  };

  /* ── Columns ── */
  const columns = [
    {
      title: "Bank",
      key: "bank",
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{r.bankName}</div>
            <div className="text-gray-400 text-xs truncate font-mono">{r.accountNumber}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Branch / SWIFT",
      key: "branchSwift",
      render: (_, r) => (
        <div className="text-sm">
          <div className="truncate">{r.branchName || <span className="text-gray-300">—</span>}</div>
          <div className="text-gray-400 font-mono text-xs">{r.swiftCode || <span className="text-gray-300">—</span>}</div>
        </div>
      ),
    },
    {
      title: "Opening Balance",
      dataIndex: "openingBalance",
      key: "openingBalance",
      render: (v) => <span className="font-mono">{Number(v || 0).toLocaleString()} SAR</span>,
    },
    {
      title: "Current Balance",
      dataIndex: "currentBalance",
      key: "currentBalance",
      render: (v) => (
        <span className={`font-mono font-semibold ${Number(v) >= 0 ? "text-green-600" : "text-red-600"}`}>
          {Number(v || 0).toLocaleString()} SAR
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      filters: [
        { text: "Active",   value: true  },
        { text: "Inactive", value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive, r) => (
        <Switch
          checked={!!isActive}
          onChange={(checked) => handleStatusToggle(r.id, checked)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      render: (_, r) => (
        <Space>
          <Button variant="link" color="primary" icon={<Edit className="w-5 h-5" />} onClick={() => showModal(r)} />
          <Button variant="link" color="danger"  icon={<Trash className="w-5 h-5" />} onClick={() => setDeleteTarget(r)} />
        </Space>
      ),
    },
  ];

  /* ── Render ── */
  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-2xl font-bold">Bank Accounts</h1>
        <Space wrap>
          <Select value={orderBy} onChange={setOrderBy} style={{ width: 130 }}>
            <Select.Option value="bankDate">Bank Date</Select.Option>
            <Select.Option value="createdAt">Created At</Select.Option>
          </Select>
          <Select value={orderDir} onChange={setOrderDir} style={{ width: 90 }}>
            <Select.Option value="asc">Asc</Select.Option>
            <Select.Option value="desc">Desc</Select.Option>
          </Select>
          <Input
            placeholder="Search banks..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<Search className="w-4 h-4" />}
            allowClear
            style={{ width: 220 }}
          />
          <Button type="primary" icon={<Plus />} onClick={() => showModal()}>
            Add Bank
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { title: "Total Banks",     value: totals.total,        icon: <Landmark  className="w-8 h-8 text-blue-600"   /> },
          { title: "Active Banks",    value: totals.active,       icon: <CheckCircle className="w-8 h-8 text-green-600" /> },
          { title: "Total Opening",   value: `${totals.totalOpening.toLocaleString()} SAR`, icon: <Wallet     className="w-8 h-8 text-purple-600" /> },
          { title: "Total Balance",   value: `${totals.totalBalance.toLocaleString()} SAR`, icon: <DollarSign className="w-8 h-8 text-emerald-600" /> },
        ].map(({ title, value, icon }) => (
          <div key={title} className="bg-white p-5 rounded-lg shadow flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm font-medium">{title}</div>
              <div className="text-3xl font-bold text-gray-800">{value}</div>
            </div>
            {icon}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white p-1 rounded-lg shadow">
        <div className="flex justify-between items-center p-3 mb-2">
          <div className="text-lg font-semibold">Bank Accounts ({banks.length})</div>
        </div>
        <Table
          loading={loadingList}
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
        />
      </div>

      {/* Delete Confirm */}
      <CustomAlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Remove Bank Account?"
        description={`Are you sure you want to remove "${deleteTarget?.bankName}"? If it has existing transactions, it will be safely deactivated instead.`}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        variant="danger"
        confirmText="Confirm Action"
      />

      {/* Add / Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
              <Landmark className="w-5 h-5 text-blue-600" />
            </span>
            {isEditModal ? "Edit Bank Account" : "Add Bank Account"}
          </div>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={720}
        style={{ top: 16 }}
        bodyStyle={{ maxHeight: "75vh", overflow: "auto" }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Bank Name *"
              name="bankName"
              rules={[{ required: true, message: "Enter bank name!" }]}
            >
              <Input placeholder="e.g. Al Rajhi Bank" />
            </Form.Item>

            <Form.Item
              label="Account Number *"
              name="accountNumber"
              rules={[{ required: true, message: "Enter account number!" }]}
            >
              <Input placeholder="e.g. SA1234567890" className="font-mono" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Branch Name" name="branchName">
              <Input placeholder="e.g. Riyadh Main Branch" />
            </Form.Item>

            <Form.Item label="SWIFT / IBAN Code" name="swiftCode">
              <Input placeholder="e.g. RJHISARI" className="font-mono" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Opening Balance (SAR)"
              name="openingBalance"
              rules={[{ required: true, message: "Enter opening balance!" }]}
            >
              <Input type="number" placeholder="0.00" min={0} />
            </Form.Item>

            <Form.Item label="Bank Date *" name="bankDate" rules={[{ required: true, message: "Select date!" }]}>
              <DatePicker className="w-full" />
            </Form.Item>
          </div>

          <Form.Item label="Status" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {isEditModal ? "Update Bank" : "Save Bank"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default BankAccountsPage;