import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Modal,
  Button,
  Input,
  Form,
  Switch,
  Space,
  Select,
  Tooltip,
  Card,
  DatePicker,
  Tag,
  Empty,
  Badge,
} from "antd";
import dayjs from "dayjs";
import {
  Edit,
  Trash,
  Plus,
  Search,
  X,
  Users,
  CheckCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Filter,
  TrendingUp,
  UserCheck,
  SaudiRiyal,
  Wallet,
} from "lucide-react";
import { appToast } from "../../shadcn/components/ui/appToast"; // adjust path as needed
import CustomAlertDialog from "../components/CustomAlertDialog"; // adjust path as needed
import { useAuth } from "../context/AuthContext"; // ✅ ADD THIS

const { Option } = Select;

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE}/api/customers`;

// Central place to describe each CustomerType enum value.
// Add/remove an entry here whenever the Prisma enum changes — nothing
// else in the component needs to know about the raw enum values.
const CUSTOMER_TYPE_META = {
  WALK_IN: {
    label: "Walk In",
    tagColor: "green",
    icon: Users,
  },
  CORPORATE: {
    label: "Corporate",
    tagColor: "blue",
    icon: Building2,
  },
  TABBY_OR_TAMARA: {
    label: "Tabby / Tamara",
    tagColor: "purple",
    icon: Wallet,
  },
};

const getCustomerTypeMeta = (type) =>
  CUSTOMER_TYPE_META[type] || {
    label: type || "Unknown",
    tagColor: "default",
    icon: Users,
  };

const CustomersPage = () => {
  // ✅ RBAC — permission flags
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("CUSTOMER_CREATE");
  const canEdit = hasPermission("CUSTOMER_EDIT");
  const canDelete = hasPermission("CUSTOMER_DELETE");
  const hasAnyRowAction = canEdit || canDelete;

  const [customers, setCustomers] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  const [orderBy, setOrderBy] = useState("customerDate");
  const [orderDir, setOrderDir] = useState("desc");

  const [form] = Form.useForm();
  const token = localStorage.getItem("token");

  /* ========================= API CALLS ========================= */
  const loadCustomers = async () => {
    setLoadingTable(true);
    try {
      const query = new URLSearchParams({ orderBy, orderDir }).toString();
      const res = await fetch(`${API_URL}?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch customers");
      const json = await res.json();
      setCustomers(json.data || []);
    } catch (error) {
      appToast.error("Load Failed", "Failed to load customers");
      console.error(error);
    } finally {
      setLoadingTable(false);
    }
  };

  const createCustomer = async (payload) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.message || "Failed to create customer");
    }
    return res.json();
  };

  const updateCustomer = async (id, payload) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.message || "Failed to update customer");
    }
    return res.json();
  };

  const deleteCustomer = async (id) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.message || "Failed to delete customer");
    }
    return res.json();
  };

  const toggleStatus = async (id, isActive) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.message || "Failed to update status");
    }
    return res.json();
  };

  /* ========================= EFFECTS ========================= */
  useEffect(() => {
    loadCustomers();
  }, [orderBy, orderDir]);

  /* ========================= FILTERED DATA ========================= */
  const filteredData = useMemo(() => {
    let data = [...customers];
    if (searchText) {
      const search = searchText.toLowerCase();
      data = data.filter(
        (c) =>
          c.customerName?.toLowerCase().includes(search) ||
          c.contactPerson?.toLowerCase().includes(search) ||
          c.phone?.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search),
      );
    }
    if (filterType) data = data.filter((c) => c.customerType === filterType);
    if (filterStatus !== null)
      data = data.filter((c) => c.isActive === filterStatus);
    return data;
  }, [customers, searchText, filterType, filterStatus]);

  /* ========================= STATS ========================= */
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.isActive).length;
  const corporateCustomers = customers.filter(
    (c) => c.customerType === "CORPORATE",
  ).length;
  const TABBY_OR_TAMARACustomers = customers.filter(
    (c) => c.customerType === "TABBY_OR_TAMARA",
  ).length;

  /* ========================= MODAL ========================= */
  const showModal = (customer = null) => {
    // ✅ RBAC guard
    if (customer && !canEdit) return;
    if (!customer && !canCreate) return;

    setIsModalOpen(true);
    setIsEditModal(!!customer);
    setCurrentCustomer(customer);
    if (customer) {
      form.setFieldsValue({
        name: customer.customerName,
        type: customer.customerType,
        customerVatId: customer.customerVatId,
        contactPerson: customer.contactPerson,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        openingBalance: customer.openingBalance,
        status: customer.isActive,
        customerDate: customer.customerDate
          ? dayjs(customer.customerDate)
          : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: true,
        customerDate: dayjs(),
        openingBalance: 0,
      });
    }
  };

  const handleSubmit = async (values) => {
    // ✅ RBAC guard
    if (isEditModal && !canEdit) return;
    if (!isEditModal && !canCreate) return;

    setLoadingForm(true);
    try {
      const payload = {
        customerName: values.name,
        customerType: values.type,
        customerVatId: values.customerVatId,
        contactPerson: values.contactPerson,
        phone: values.phone,
        email: values.email || null,
        address: values.address || null,
        openingBalance: Number(values.openingBalance || 0),
        isActive: values.status ?? true,
        customerDate: values.customerDate
          ? values.customerDate.toISOString()
          : null,
      };
      if (isEditModal) {
        await updateCustomer(currentCustomer.id, payload);
        appToast.success("Updated", "Customer updated successfully!");
      } else {
        await createCustomer(payload);
        appToast.success("Created", "Customer created successfully!");
      }
      setIsModalOpen(false);
      form.resetFields();
      loadCustomers();
    } catch (error) {
      appToast.error("Save Failed", error.message || "Failed to save customer");
    } finally {
      setLoadingForm(false);
    }
  };

  /* ========================= DELETE ========================= */
  const handleConfirmDelete = async () => {
    if (!canDelete) return; // ✅ RBAC guard
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteCustomer(deleteTarget.id);
      if (result.type === "soft-delete") {
        appToast.warning(
          "Customer Deactivated",
          "Customer has transaction history and has been deactivated to preserve ledger integrity.",
        );
      } else {
        appToast.success(
          "Deleted",
          "Customer permanently deleted successfully!",
        );
      }
      loadCustomers();
    } catch (error) {
      appToast.error(
        "Delete Failed",
        error.message || "Failed to delete customer",
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  /* ========================= STATUS TOGGLE ========================= */
  const handleStatusToggle = async (id, checked) => {
    if (!canEdit) return; // ✅ RBAC guard — status toggle is an edit action

    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: checked } : c)),
    );
    try {
      await toggleStatus(id, checked);
      appToast.success(
        "Status Updated",
        `Customer ${checked ? "activated" : "deactivated"}`,
      );
    } catch (error) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !checked } : c)),
      );
      appToast.error(
        "Update Failed",
        error.message || "Failed to update status",
      );
    }
  };

  const clearFilters = () => {
    setSearchText("");
    setFilterType(null);
    setFilterStatus(null);
  };
  const hasActiveFilters = searchText || filterType || filterStatus !== null;

  /* ========================= COLUMNS ========================= */
  const columns = [
    {
      title: "Customer Details",
      width: "30%",
      render: (_, record) => {
        const meta = getCustomerTypeMeta(record.customerType);
        const TypeIcon = meta.icon;
        return (
          <div className="py-2">
            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg">
                <TypeIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-base mb-1">
                  {record.customerName}
                </div>
                <Tag color={meta.tagColor} className="text-xs">
                  {meta.label}
                </Tag>
                <div className="text-sm text-gray-600 mt-2">
                  <UserCheck className="w-3 h-3 inline mr-1" />
                  {record.contactPerson}
                </div>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Contact Information",
      width: "25%",
      render: (_, record) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="w-4 h-4 text-blue-600" />
            {record.phone}
          </div>
          {record.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-green-600" />
              {record.email}
            </div>
          )}
          {record.address && (
            <div className="flex items-start gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{record.address}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Opening Balance",
      align: "right",
      width: "15%",
      render: (_, record) => (
        <div className="text-right">
          <div className="text-lg font-bold text-indigo-600 inline-flex items-center">
            <SaudiRiyal size={16} />{" "}
            {Number(record.openingBalance || 0).toFixed(2)}
          </div>
          {record.customerDate && (
            <div className="text-xs text-gray-500 mt-1 flex items-center justify-end gap-1">
              <Calendar className="w-3 h-3" />
              {dayjs(record.customerDate).format("MMM DD, YYYY")}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Current Balance",
      align: "right",
      width: "15%",
      render: (_, record) => (
        <div className="text-right">
          <div className="text-lg font-bold text-rose-600 inline-flex items-center">
            <SaudiRiyal size={16} />{" "}
            {Number(record.account?.balance || 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-end gap-1">
            <TrendingUp className="w-3 h-3" />
            Up to date
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      align: "center",
      width: "12%",
      render: (_, record) => (
        <div className="flex flex-col items-center gap-2">
          <Switch
            checked={record.isActive}
            onChange={(checked) => handleStatusToggle(record.id, checked)}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            disabled={!canEdit} // ✅ RBAC
          />
          <Badge
            status={record.isActive ? "success" : "default"}
            text={record.isActive ? "Active" : "Inactive"}
          />
        </div>
      ),
    },
    // ✅ RBAC — only add Actions column if user can do anything
    ...(hasAnyRowAction
      ? [
          {
            title: "Actions",
            align: "center",
            width: "12%",
            render: (_, record) => (
              <Space>
                {canEdit && (
                  <Tooltip title="Edit Customer">
                    <Button
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => showModal(record)}
                      className="hover:bg-blue-50 hover:border-blue-300"
                    />
                  </Tooltip>
                )}
                {canDelete && (
                  <Tooltip title="Delete Customer">
                    <Button
                      danger
                      icon={<Trash className="w-4 h-4" />}
                      onClick={() => setDeleteTarget(record)}
                      className="hover:bg-red-50"
                    />
                  </Tooltip>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  /* ========================= UI ========================= */
  return (
    <div className="p-4 md:p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Customers Management
          </h1>
          <p className="text-gray-600">Manage and track all your customers</p>
        </div>
        {/* ✅ RBAC — hide "Add New Customer" if no create permission */}
        {canCreate && (
          <Button
            type="primary"
            size="large"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => showModal()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 border-none hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            Add New Customer
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-lg border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-600 text-sm font-medium mb-1">
                Total Customers
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {totalCustomers}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </Card>
        <Card className="shadow-lg border-l-4 border-l-green-500 hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-600 text-sm font-medium mb-1">
                Active Customers
              </div>
              <div className="text-3xl font-bold text-green-600">
                {activeCustomers}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </Card>
        <Card className="shadow-lg border-l-4 border-l-purple-500 hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-600 text-sm font-medium mb-1">
                Corporate
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {corporateCustomers}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-lg mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <Filter className="w-5 h-5" />
            Filters:
          </div>
          <Input
            placeholder="Search by name, contact, phone, email..."
            prefix={<Search className="w-4 h-4 text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear={{ clearIcon: <X className="w-4 h-4" /> }}
            className="w-full sm:w-80"
            size="large"
          />
          <Select
            placeholder="Customer Type"
            value={filterType}
            onChange={setFilterType}
            allowClear
            className="w-44"
            size="large"
          >
            <Option value="WALK_IN">Walk In</Option>
            <Option value="CORPORATE">Corporate</Option>
            <Option value="TABBY_OR_TAMARA">Tabby / Tamara</Option>
          </Select>
          <Select
            placeholder="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            allowClear
            className="w-36"
            size="large"
          >
            <Option value={true}>Active</Option>
            <Option value={false}>Inactive</Option>
          </Select>
          <Select
            value={orderBy}
            onChange={setOrderBy}
            className="w-48"
            size="large"
          >
            <Option value="customerDate">Order by Date</Option>
            <Option value="createdAt">Order by Created</Option>
            <Option value="customerName">Order by Name</Option>
          </Select>
          <Select
            value={orderDir}
            onChange={setOrderDir}
            className="w-36"
            size="large"
          >
            <Option value="desc">Descending</Option>
            <Option value="asc">Ascending</Option>
          </Select>
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              icon={<X className="w-4 h-4" />}
              danger
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-lg">
        <Table
          loading={loadingTable}
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} customers`,
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  hasActiveFilters
                    ? "No customers match your filters"
                    : "No customers yet. Add your first customer!"
                }
              />
            ),
          }}
          className="custom-table"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 text-xl font-bold">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
              {isEditModal ? (
                <Edit className="w-6 h-6 text-white" />
              ) : (
                <Plus className="w-6 h-6 text-white" />
              )}
            </div>
            {isEditModal ? "Edit Customer" : "Add New Customer"}
          </div>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
        centered
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          className="mt-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              name="name"
              label={<span className="font-semibold">Customer Name</span>}
              rules={[{ required: true, message: "Customer name is required" }]}
            >
              <Input
                placeholder="e.g. Bin Sheban Trading LLC"
                size="large"
                prefix={<Building2 className="w-4 h-4 text-gray-400" />}
              />
            </Form.Item>
            <Form.Item
              name="type"
              label={<span className="font-semibold">Customer Type</span>}
              rules={[{ required: true, message: "Select customer type" }]}
            >
              <Select placeholder="Select type" size="large">
                <Option value="WALK_IN">Walk In Customer</Option>
                <Option value="CORPORATE">Corporate Client</Option>
                <Option value="TABBY_OR_TAMARA">Tabby / Tamara</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="customerVatId"
              label={<span className="font-semibold">Customer VAT ID</span>}
            >
              <Input
                placeholder="e.g. 7421158960"
                size="large"
                prefix={<SaudiRiyal className="w-4 h-4 text-gray-400" />}
              />
            </Form.Item>
            <Form.Item
              name="contactPerson"
              label={<span className="font-semibold">Contact Person</span>}
              rules={[
                { required: true, message: "Contact person is required" },
              ]}
            >
              <Input
                placeholder="e.g. Ahmed Bin Sheban"
                size="large"
                prefix={<UserCheck className="w-4 h-4 text-gray-400" />}
              />
            </Form.Item>
            <Form.Item
              name="phone"
              label={<span className="font-semibold">Phone Number</span>}
              rules={[{ required: true, message: "Phone number is required" }]}
            >
              <Input
                placeholder="+971 50 123 4567"
                size="large"
                prefix={<Phone className="w-4 h-4 text-gray-400" />}
              />
            </Form.Item>
            <Form.Item
              name="email"
              label={<span className="font-semibold">Email Address</span>}
            >
              <Input
                placeholder="example@email.com"
                size="large"
                prefix={<Mail className="w-4 h-4 text-gray-400" />}
              />
            </Form.Item>
            <Form.Item
              name="customerDate"
              label={<span className="font-semibold">Customer Date</span>}
              rules={[{ required: true, message: "Select customer date" }]}
            >
              <DatePicker className="w-full" size="large" format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              name="openingBalance"
              label={<span className="font-semibold">Opening Balance</span>}
            >
              <Input
                type="number"
                placeholder="0.00"
                size="large"
                prefix={<SaudiRiyal className="w-4 h-4 text-gray-400" />}
              />
            </Form.Item>
            <Form.Item
              name="status"
              label={<span className="font-semibold">Status</span>}
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                size="default"
              />
            </Form.Item>
            <Form.Item
              name="address"
              label={<span className="font-semibold">Address</span>}
              className="md:col-span-3"
            >
              <Input.TextArea
                rows={3}
                placeholder="Street, City, Country"
                size="large"
              />
            </Form.Item>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              size="large"
              onClick={() => {
                setIsModalOpen(false);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loadingForm}
              size="large"
              className="min-w-[140px] bg-gradient-to-r from-blue-600 to-indigo-600 border-none"
            >
              {isEditModal ? "Update Customer" : "Save Customer"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation */}
      {canDelete && (
        <CustomAlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
          title="Remove Customer?"
          description={`Are you sure you want to remove "${deleteTarget?.customerName}"? If they have existing ledger entries, they will be safely deactivated instead of deleted.`}
          onConfirm={handleConfirmDelete}
          loading={isDeleting}
          variant="danger"
          confirmText="Confirm Action"
        />
      )}
    </div>
  );
};

export default CustomersPage;
