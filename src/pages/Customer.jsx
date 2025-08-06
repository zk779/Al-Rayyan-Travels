import React, { useState, useMemo } from "react";
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
  Tag,
  Tooltip,
} from "antd";
import {
  Edit,
  Trash,
  Plus,
  Search,
  User,
  FileText,
  TrendingUp,
  TrendingDown,
  X,
  CheckCircle,
} from "lucide-react";
import dayjs from "dayjs";

const { Option } = Select;

const CustomersPage = () => {
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: "Bin Sheban Trading LLC",
      type: "Corporate",
      contactPerson: "Ahmed Bin Sheban",
      phone: "+971-50-123-4567",
      email: "ahmed@binsheban.com",
      address: "Dubai, UAE",
      openingBalance: 0,
      crAmount: 2000,
      drAmount: 8000,
      currentBalance: 6000,
      status: true,
      lastBooking: "2025-01-03",
      bookings: 15,
    },
    {
      id: 2,
      name: "Al-Rayyan Construction",
      type: "Corporate",
      contactPerson: "Mudassar Javed",
      phone: "+971-55-987-6543",
      email: "mudassar@alrayyan.com",
      address: "Sharjah, UAE",
      openingBalance: 0,
      crAmount: 1000,
      drAmount: 5000,
      currentBalance: 4000,
      status: true,
      lastBooking: "2025-01-01",
      bookings: 8,
    },
    {
      id: 3,
      name: "Emirates Steel",
      type: "Corporate",
      contactPerson: "Sara Al-Mansoori",
      phone: "+971-4-555-0123",
      email: "",
      address: "",
      openingBalance: 0,
      crAmount: 0,
      drAmount: 0,
      currentBalance: 0,
      status: true,
      lastBooking: "",
      bookings: 0,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const filteredData = useMemo(() => {
    let data = [...customers];

    if (searchText) {
      data = data.filter(
        (c) =>
          c.name.toLowerCase().includes(searchText.toLowerCase()) ||
          c.contactPerson.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterType) {
      data = data.filter((c) => c.type === filterType);
    }

    return data;
  }, [customers, searchText, filterType]);

  const handleFormValuesChange = (_, allValues) => {
    const { openingBalance = 0, crAmount = 0, drAmount = 0 } = allValues;
    const currentBalance = openingBalance + crAmount - drAmount;
    form.setFieldsValue({ currentBalance });
  };

  const showModal = (customer = null) => {
    setIsModalOpen(true);
    if (customer) {
      setIsEditModal(true);
    } else {
      setIsEditModal(false);
    }
    setCurrentCustomer(customer);
    if (customer) {
      form.setFieldsValue({
        ...customer,
        date: customer.lastBooking ? dayjs(customer.lastBooking) : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: true });
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        lastBooking: values.date
          ? values.date.format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD"),
        date: undefined,
      };

      const newCustomers = isEditModal
        ? customers.map((c) =>
            c.id === currentCustomer.id ? { ...c, ...formattedValues } : c
          )
        : [
            ...customers,
            {
              id: Date.now(),
              ...formattedValues,
            },
          ];

      setCustomers(newCustomers);
      message.success(
        `Customer ${isEditModal ? "updated" : "added"} successfully!`
      );
      setIsModalOpen(false);
    } catch (error) {
      message.error("Failed to save customer.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this customer?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        setCustomers(customers.filter((c) => c.id !== id));
        message.success("Customer deleted!");
      },
    });
  };

  const handleDeleteSelected = () => {
    Modal.confirm({
      title: "Delete selected customers?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        setCustomers(customers.filter((c) => !selectedRowKeys.includes(c.id)));
        message.success("Selected customers deleted!");
        setSelectedRowKeys([]);
      },
    });
  };
  const handleStatusToggle = (id, checked) => {
    const newVendors = vendors.map((vendor) =>
      vendor.id === id ? { ...vendor, status: checked } : vendor
    );
    updateData(newVendors);
    message.success(
      `Vendor status updated to ${checked ? "Active" : "Inactive"}`
    );
  };

  const columns = [
    {
      title: "Customer Details",
      key: "customerDetails",
      dataIndex: "name",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {record.name.charAt(0)}
            </span>
          </div>
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-gray-500 text-sm">{record.type}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Contact Info",
      key: "contactInfo",
      render: (_, record) => (
        <div>
          <div>📞 {record.phone}</div>
          <div>📧 {record.email || "N/A"}</div>
          <div>📍 {record.address || "N/A"}</div>
        </div>
      ),
    },
    {
      title: "Business Info",
      key: "businessInfo",
      render: (_, record) => (
        <div>
          <div>Contact: {record.contactPerson}</div>
          <div>Bookings: {record.bookings}</div>
          <div>Last: {record.lastBooking || "N/A"}</div>
          {record.lastBooking && (
            <Tooltip title="Contract Available">
              <a href="#" className="text-blue-600">
                📄 Contract Available
              </a>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Opening Balance",
      dataIndex: "openingBalance",
      align: "right",
      render: (val) => <span className="font-medium">$ {val}</span>,
    },
    {
      title: "CR Amount",
      dataIndex: "crAmount",
      align: "right",
      render: (val) => (
        <span className="text-green-600 font-medium">$ {val}</span>
      ),
    },
    {
      title: "DR Amount",
      dataIndex: "drAmount",
      align: "right",
      render: (val) => (
        <span className="text-red-600 font-medium">$ {val}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      filteredValue: filterType !== null ? [filterType] : null,
      onFilter: (value, record) => record.status === value,
      render: (status, record) => (
        <Switch
          checked={status}
          onChange={(checked) => handleStatusToggle(record.id, checked)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              variant="link"
              color="blue"
              icon={<Edit className="w-4 h-4 text-blue-600" />}
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              variant="link"
              color="red"
              icon={<Trash className="w-4 h-4 text-red-600" />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Stats Section */}
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>

        <div className="flex gap-2">
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Search by name or contact person..."
              prefix={<Search className="w-5 h-5 text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full sm:w-60"
              allowClear={{
                clearIcon: (
                  <X
                    onClick={() => setSearchText("")}
                    className="w-4 h-4 text-gray-500"
                  />
                ),
              }}
            />

            <Select
              placeholder="All Types"
              value={filterType}
              onChange={setFilterType}
              allowClear
              className="w-32"
            >
              <Option value="Corporate">Corporate</Option>
              <Option value="Individual">Individual</Option>
            </Select>
          </div>

          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={showModal}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            Add New Customer
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-lg shadow flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-sm font-medium">
              Total Customers
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {customers.length}
            </div>
          </div>
          <div className="flex items-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-sm font-medium">
              Total Receivables
            </div>
            <div className="text-3xl font-bold text-green-600">$</div>
            <div className="text-gray-500 text-xs">Money customers owe us</div>
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-sm font-medium">
              Total Payables
            </div>
            <div className="text-3xl font-bold text-red-600">$</div>
            <div className="text-gray-500 text-xs">Money we owe customers</div>
          </div>
          <div className="flex items-center">
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-sm font-medium">
              Active Customers
            </div>
            <div className="text-3xl font-bold text-gray-800"></div>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Controls and Table */}
      <div className="bg-white p-5 rounded-xl shadow mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Customers List ({filteredData.length})
          </h2>
          {selectedRowKeys.length > 0 && (
            <Button
              danger
              onClick={handleDeleteSelected}
              icon={<Trash className="w-5 h-5 mr-2" />}
              className="flex items-center"
            >
              Delete Selected
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10, showQuickJumper: true }}
          scroll={{ x: "max-content" }}
          rowSelection={rowSelection}
          className="mt-5 border-t"
          bordered={false}
        />
      </div>

      <Modal
        title={isEditModal ? "Edit Customer" : "Add New Customer"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
          onValuesChange={handleFormValuesChange}
        >
          <div className="grid grid-cols-2 gap-4 mb-0">
            <Form.Item
              label="Customer Name *"
              name="name"
              style={{ marginBottom: "0px" }}
              rules={[
                { required: true, message: "Please enter customer name!" },
              ]}
            >
              <Input placeholder="e.g., Bin Sheban Trading LLC" />
            </Form.Item>

            <Form.Item
              label="Customer Type *"
              name="type"
              rules={[{ required: true, message: "Select customer type!" }]}
            >
              <Select placeholder="Select customer type">
                <Option value="Corporate">Corporate</Option>
                <Option value="Individual">Individual</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-0">
            <Form.Item
              label="Contact Person *"
              name="contactPerson"
              rules={[{ required: true, message: "Enter contact person!" }]}
            >
              <Input placeholder="e.g., Ahmed Bin Sheban" />
            </Form.Item>

            <Form.Item
              label="Phone *"
              name="phone"
              rules={[{ required: true, message: "Enter phone number!" }]}
            >
              <Input placeholder="e.g., +971-50-123-4567" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-0">
            <Form.Item label="Email (Optional)" name="email">
              <Input placeholder="e.g., ahmed@binsheban.com" />
            </Form.Item>

            <Form.Item label="Address (Optional)" name="address">
              <Input placeholder="e.g., Dubai, UAE" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-0">
            <Form.Item label="Opening Balance ($)" name="openingBalance">
              <Input type="number" placeholder="0.00" />
            </Form.Item>

            <Form.Item label="Balance Type" name="balanceType">
              <Select placeholder="Credit (CR)">
                <Option value="Credit (CR)">Credit (CR)</Option>
                <Option value="Debit (DR)">Debit (DR)</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="Status" name="status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {isEditModal ? "Update Customer" : "Save Customer"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomersPage;
