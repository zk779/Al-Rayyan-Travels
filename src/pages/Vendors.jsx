import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Modal,
  Button,
  Input,
  Form,
  Switch,
  message,
  Space,
  Select,
  DatePicker,
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
} from "lucide-react";

// Components & Utils
import CustomAlertDialog from "../components/CustomAlertDialog"; 
import { appToast } from "../../shadcn/components/ui/appToast"; 
import { useAuth } from "../context/AuthContext"; // ✅ ADD THIS

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
    l.toLowerCase().startsWith("contact person:")
  );
  const contactPerson =
    cpLineIdx >= 0 ? lines[cpLineIdx].split(":").slice(1).join(":").trim() : "";
  const location =
    cpLineIdx >= 0 ? lines.slice(0, cpLineIdx).join(", ") : lines.join(", ");
  return { location, contactPerson };
}

const VendorsPage = () => {
  // ✅ RBAC — permission flags
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("VENDOR_CREATE");
  const canEdit = hasPermission("VENDOR_EDIT");
  const canDelete = hasPermission("VENDOR_DELETE");
  const hasAnyRowAction = canEdit || canDelete;

  const [vendors, setVendors] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [orderBy, setOrderBy] = useState("vendorDate");
  const [orderDir, setOrderDir] = useState("desc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
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

  const filteredData = useMemo(() => {
    const q = searchText.toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => v.name.toLowerCase().includes(q));
  }, [vendors, searchText]);

  const totals = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter((v) => v.status).length;
    const receivables = vendors
      .filter((v) => v._category !== "DEBIT")
      .reduce((s, v) => s + v.currentBalance, 0);
    const payables = vendors
      .filter((v) => v._category === "DEBIT")
      .reduce((s, v) => s + v.currentBalance, 0);
    return { total, active, receivables, payables };
  }, [vendors]);

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
            balanceType: vendor._category === "DEBIT" ? "Debit (DR)" : "Credit (CR)",
            vendorDate: vendor.vendorDate ? dayjs(vendor.vendorDate) : dayjs(),
            status: vendor.status,
          }
        : {
            openingBalance: 0,
            balanceType: "Credit (CR)",
            vendorDate: dayjs(),
            status: true,
          }
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
          deleteTarget.map((id) => apiRequest(`/api/vendors/${id}`, { method: "DELETE" }))
        );
        appToast.success("Selected vendors processed successfully");
        setSelectedRowKeys([]);
      } else {
        const res = await apiRequest(`/api/vendors/${deleteTarget.id}`, { method: "DELETE" });
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

    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, status: checked } : v)));
    try {
      await apiRequest(`/api/vendors/${id}`, {
        method: "PUT",
        body: { status: checked },
      });
      appToast.success(`Vendor ${checked ? "Activated" : "Deactivated"}`);
    } catch (e) {
      setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, status: !checked } : v)));
      appToast.error(e.message || "Failed to update status");
    }
  };

  const columns = [
    {
      title: "Vendor Details",
      key: "vendorDetails",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-blue-600 font-semibold">{(record.name || "?").charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{record.name}</div>
            <div className="text-gray-500 text-sm truncate">{record.contactPerson}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Contact Info",
      key: "contactInfo",
      render: (_, record) => (
        <div className="min-w-[220px]">
          <div className="truncate">📞 {record.contact}</div>
          <div className="truncate">📧 {record.email}</div>
          <div className="truncate">📍 {record.location}</div>
        </div>
      ),
    },
    {
      title: "Opening Balance",
      dataIndex: "openingBalance",
      key: "openingBalance",
      render: (value) => `${Number(value || 0).toLocaleString()} SAR`,
    },
    {
      title: "Type",
      dataIndex: "_category",
      key: "_category",
      render: (value) => {
        const label =
          value === "DEBIT"
            ? "Debit (DR)"
            : value === "CREDIT"
            ? "Credit (CR)"
            : value || "-";
        const colorClass =
          value === "DEBIT" ? "text-red-600" : "text-green-600";
        return <span className={colorClass}>{label}</span>;
      },
    },
    {
      title: "Current Balance",
      dataIndex: "currentBalance",
      key: "currentBalance",
      render: (value, record) => {
        const n = Number(value || 0);
        const tag = record._category === "DEBIT" ? "DR" : "CR";
        return (
          <span className={n >= 0 ? "text-green-600" : "text-red-600"}>
            ${n} {tag}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
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
          disabled={!canEdit} // ✅ RBAC
        />
      ),
    },
    // ✅ RBAC — only add Actions column if user can do anything
    ...(hasAnyRowAction
      ? [
          {
            title: "Actions",
            key: "actions",
            fixed: "right",
            render: (_, record) => (
              <Space>
                {canEdit && (
                  <Button
                    variant="link"
                    color="primary"
                    icon={<Edit className="w-5 h-5" />}
                    onClick={() => showModal(record)}
                  />
                )}
                {canDelete && (
                  <Button
                    variant="link"
                    color="danger"
                    icon={<Trash className="w-5 h-5" />}
                    onClick={() => setDeleteTarget(record)}
                  />
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <Space>
          <Select value={orderBy} onChange={setOrderBy}>
            <Select.Option value="vendorDate">Vendor Date</Select.Option>
            <Select.Option value="createdAt">Created At</Select.Option>
          </Select>
          <Select value={orderDir} onChange={setOrderDir}>
            <Select.Option value="asc">Asc</Select.Option>
            <Select.Option value="desc">Desc</Select.Option>
          </Select>
          <Input
            placeholder="Search vendors..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<Search className="w-5 h-5" />}
            size="middle"
            allowClear
          />
          {/* ✅ RBAC — hide "Add Vendor" if no create permission */}
          {canCreate && (
            <Button type="primary" icon={<Plus />} onClick={() => showModal()}>
              Add Vendor
            </Button>
          )}
        </Space>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            title: "Total Vendors",
            count: totals.total,
            icon: <Store className="w-8 h-8 text-blue-600" />,
          },
          {
            title: "Total Payables",
            count: `$${totals.payables} DR`,
            icon: <TrendingDown className="w-8 h-8 text-red-600" />,
          },
          {
            title: "Total Receivables",
            count: `$${totals.receivables} CR`,
            icon: <TrendingUp className="w-8 h-8 text-green-600" />,
          },
          {
            title: "Active Vendors",
            count: totals.active,
            icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          },
        ].map(({ title, count, icon }, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-lg shadow flex items-center justify-between"
          >
            <div>
              <div className="text-gray-500 text-sm font-medium">{title}</div>
              <div className="text-3xl font-bold text-gray-800">{count}</div>
            </div>
            <div className="flex items-center">{icon}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white p-1 rounded-lg shadow">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center p-3 mb-2">
          <div className="text-lg font-semibold">
            Vendors List ({vendors.length})
          </div>
        </div>

        <Table
          loading={loadingList}
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          // rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
        />
      </div>

      {/* ✅ RBAC — only mount delete dialog if user can delete */}
      {canDelete && (
        <CustomAlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
          title={Array.isArray(deleteTarget) ? "Delete Selected Vendors?" : "Remove Vendor?"}
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
          <div className="flex items-center">
            <span className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mr-2">
              <Store className="w-6 h-6 text-blue-600" />
            </span>
            {isEditModal ? "Edit Vendor" : "Add New Vendor"}
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
              rules={[{ required: false, message: "Enter email!" }]}
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