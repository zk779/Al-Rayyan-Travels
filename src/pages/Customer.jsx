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
  Tooltip,
  Card,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import { Edit, Trash, Plus, Search, X, Users, CheckCircle } from "lucide-react";

const { Option } = Select;

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE}/api/customers`;

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState(null);

  // ✅ NEW: ordering states
  const [orderBy, setOrderBy] = useState("customerDate");
  const [orderDir, setOrderDir] = useState("desc");

  const [form] = Form.useForm();
  const token = localStorage.getItem("token");

  /* =========================
     🔗 BACKEND API CALLS
  ========================= */

  const loadCustomers = async () => {
    setLoadingTable(true);
    try {
      const query = new URLSearchParams({
        orderBy,
        orderDir,
      }).toString();

      const res = await fetch(`${API_URL}?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setCustomers(json.data || []);
    } catch {
      message.error("Failed to load customers");
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
    if (!res.ok) throw new Error();
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
    if (!res.ok) throw new Error();
  };

  const deleteCustomer = async (id) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error();
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
    if (!res.ok) throw new Error();
  };

  /* ========================= */

  useEffect(() => {
    loadCustomers();
  }, [orderBy, orderDir]);

  const filteredData = useMemo(() => {
    let data = [...customers];

    if (searchText) {
      data = data.filter(
        (c) =>
          c.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
          c.contactPerson.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterType) {
      data = data.filter((c) => c.customerType === filterType);
    }

    return data;
  }, [customers, searchText, filterType]);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.isActive).length;

  const showModal = (customer = null) => {
    setIsModalOpen(true);
    setIsEditModal(!!customer);
    setCurrentCustomer(customer);

    if (customer) {
      form.setFieldsValue({
        name: customer.customerName,
        type: customer.customerType,
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
      });
    }
  };

  const handleSubmit = async (values) => {
    setLoadingForm(true);
    try {
      const payload = {
        customerName: values.name,
        customerType: values.type,
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
        message.success("Customer updated successfully");
      } else {
        await createCustomer(payload);
        message.success("Customer created successfully");
      }

      setIsModalOpen(false);
      form.resetFields();
      loadCustomers();
    } catch {
      message.error("Failed to save customer");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete this customer?",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteCustomer(id);
          message.success("Customer deleted");
          loadCustomers();
        } catch {
          message.error("Delete failed");
        }
      },
    });
  };

  const handleStatusToggle = async (id, checked) => {
    try {
      await toggleStatus(id, checked);
      message.success(`Customer ${checked ? "activated" : "deactivated"}`);
      loadCustomers();
    } catch {
      message.error("Status update failed");
    }
  };

  const columns = [
    {
      title: "Customer",
      render: (_, r) => (
        <div>
          <div className="font-medium">{r.customerName}</div>
          <div className="text-gray-500 text-sm">{r.customerType}</div>
        </div>
      ),
    },
    {
      title: "Contact",
      render: (_, r) => (
        <div>
          <div>📞 {r.phone}</div>
          <div>📧 {r.email || "N/A"}</div>
        </div>
      ),
    },
    {
      title: "Opening Balance",
      align: "right",
      render: (_, r) => `$ ${r.openingBalance}`,
    },
    {
      title: "Status",
      render: (_, r) => (
        <Switch
          checked={r.isActive}
          onChange={(checked) => handleStatusToggle(r.id, checked)}
        />
      ),
    },
    {
      title: "Actions",
      render: (_, r) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              icon={<Edit className="w-4 h-4" />}
              onClick={() => showModal(r)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              danger
              icon={<Trash className="w-4 h-4" />}
              onClick={() => handleDelete(r.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => showModal()}
        >
          Add Customer
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-500 text-sm">Total Customers</div>
              <div className="text-3xl font-bold">{totalCustomers}</div>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
          </div>
        </Card>

        <Card className="shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-500 text-sm">Active Customers</div>
              <div className="text-3xl font-bold">{activeCustomers}</div>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <Input
          placeholder="Search customers..."
          prefix={<Search className="w-4 h-4" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear={{
            clearIcon: <X className="w-4 h-4" />,
          }}
          className="w-64"
        />

        <Select value={orderBy} onChange={setOrderBy} className="w-48">
          <Option value="customerDate">Order by Customer Date</Option>
          <Option value="createdAt">Order by Created At</Option>
        </Select>

        <Select value={orderDir} onChange={setOrderDir} className="w-40">
          <Option value="desc">Descending</Option>
          <Option value="asc">Ascending</Option>
        </Select>
      </div>

      <Table
        loading={loadingTable}
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        pagination={{ pageSize: 10 }}
        className="bg-white rounded-lg shadow-sm"
      />

      {/* Modal */}
      <Modal
        title={
          <div className="text-lg font-semibold">
            {isEditModal ? "Edit Customer" : "Add New Customer"}
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
        centered
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Customer Name"
              rules={[{ required: true, message: "Customer name is required" }]}
            >
              <Input placeholder="e.g. Bin Sheban Trading LLC" />
            </Form.Item>

            <Form.Item
              name="type"
              label="Customer Type"
              className="mb-[0px]"
              rules={[{ required: true, message: "Select customer type" }]}
            >
              <Select placeholder="Select type">
                <Option value="WALK_IN">Walk In</Option>
                <Option value="CORPORATE">Corporate</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="contactPerson"
              label="Contact Person"
              rules={[
                { required: true, message: "Contact person is required" },
              ]}
            >
              <Input placeholder="e.g. Ahmed Bin Sheban" />
            </Form.Item>

            {/* Phone */}
            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: "Phone number is required" }]}
            >
              <Input placeholder="+971 50 123 4567" />
            </Form.Item>

            <Form.Item name="email" label="Email" className="md:col-span-1">
              <Input placeholder="example@email.com" />
            </Form.Item>
            <Form.Item
              name="customerDate"
              label="Customer Date"
              rules={[{ required: true, message: "Select customer date" }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item name="address" label="Address" className="md:col-span-2">
              <Input.TextArea rows={3} placeholder="Street, City, Country" />
            </Form.Item>
            <Form.Item name="openingBalance" label="Opening Balance">
              <Input type="number" placeholder="0.00" />
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              valuePropName="checked"
              className="md:col-span-1"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loadingForm}
              className="min-w-[120px]"
            >
              {isEditModal ? "Update Customer" : "Save Customer"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomersPage;
