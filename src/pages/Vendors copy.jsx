import React, { useState } from "react";
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
} from "antd";
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
import dayjs from "dayjs";

const VendorsPage = () => {
  const [vendors, setVendors] = useState([
    {
      id: 1,
      name: "Emirates Airlines",
      contact: "+971-214-4444",
      email: "booking@emirates.com",
      contactPerson: "Ahmed Ali",
      location: "Dubai, UAE",
      openingBalance: 5000,
      crAmount: 15000,
      drAmount: 10000,
      currentBalance: 10000,
      status: true,
    },
    {
      id: 2,
      name: "Etihad Airways",
      contact: "+971-251-0000",
      email: "reservations@etihad.com",
      contactPerson: "Sara Khan",
      location: "Abu Dhabi, UAE",
      openingBalance: 3000,
      crAmount: 12000,
      drAmount: 8000,
      currentBalance: 7000,
      status: true,
    },
    {
      id: 3,
      name: "Marriott Hotels",
      contact: "+971-123-4567",
      email: "reservations@marriott.com",
      contactPerson: "John Smith",
      location: "Dubai Marina, UAE",
      openingBalance: 2500,
      crAmount: 8000,
      drAmount: 5000,
      currentBalance: 5000,
      status: true,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState(vendors);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Search functionality
  const handleSearch = (value) => {
    setSearchText(value);
    setFilteredData(
      vendors.filter((vendor) =>
        vendor.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  // Modal handling for editing and adding vendors
  const showModal = (vendor = null) => {
    setIsModalOpen(true);
    setIsEditModal(!!vendor);
    setCurrentVendor(vendor);
    form.setFieldsValue(
      vendor
        ? {
            ...vendor,
            date: vendor.date ? dayjs(vendor.date, "DD-MM-YYYY") : null,
          }
        : { status: true }
    );
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  // Update vendors data
  const updateData = (newVendors) => {
    setVendors(newVendors);
    setFilteredData(
      newVendors.filter((vendor) =>
        vendor.name.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  };

  // Submit handler for adding/updating vendor
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        date: values.date ? values.date.format("DD-MM-YYYY") : null,
      };
      const newVendors = isEditModal
        ? vendors.map((vendor) =>
            vendor.id === currentVendor.id
              ? { ...vendor, ...formattedValues }
              : vendor
          )
        : [...vendors, { id: Date.now(), ...formattedValues }];
      updateData(newVendors);
      message.success(
        `Vendor ${isEditModal ? "updated" : "added"} successfully!`
      );
      setIsModalOpen(false);
    } catch (error) {
      message.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Delete vendor
  const handleDelete = (id) =>
    Modal.confirm({
      title: "Delete this vendor?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        updateData(vendors.filter((vendor) => vendor.id !== id));
        message.success("Vendor deleted!");
      },
    });

  // Delete selected vendors
  const handleDeleteSelected = () =>
    Modal.confirm({
      title: "Delete selected vendors?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        updateData(
          vendors.filter((vendor) => !selectedRowKeys.includes(vendor.id))
        );
        message.success("Selected vendors deleted!");
        setSelectedRowKeys([]);
      },
    });

  // Toggle vendor status (active/inactive)
  const handleStatusToggle = (id, checked) => {
    const newVendors = vendors.map((vendor) =>
      vendor.id === id ? { ...vendor, status: checked } : vendor
    );
    updateData(newVendors);
    message.success(
      `Vendor status updated to ${checked ? "Active" : "Inactive"}`
    );
  };

  // Define columns for the table
  const columns = [
    {
      title: "Vendor Details",
      key: "vendorDetails",
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {record.name.charAt(0)}
            </span>
          </div>
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-gray-500 text-sm">{record.contactPerson}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Contact Info",
      key: "contactInfo",
      render: (_, record) => (
        <div>
          <div>📞 {record.contact}</div>
          <div>📧 {record.email}</div>
          <div>📍 {record.location}</div>
        </div>
      ),
    },
    {
      title: "Opening Balance",
      dataIndex: "openingBalance",
      key: "openingBalance",
      render: (value) => `$${value}`,
    },
    {
      title: "CR Amount",
      dataIndex: "crAmount",
      key: "crAmount",
      render: (value) => <span className="text-green-600">${value}</span>,
    },
    {
      title: "DR Amount",
      dataIndex: "drAmount",
      key: "drAmount",
      render: (value) => <span className="text-red-600">${value}</span>,
    },
    {
      title: "Current Balance",
      dataIndex: "currentBalance",
      key: "currentBalance",
      render: (value) => (
        <span className={value >= 0 ? "text-green-600" : "text-red-600"}>
          ${value} {value >= 0 ? "CR" : "DR"}
        </span>
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
      render: (_, record) => (
        <Space>
          <Button
            variant="link"
            color="primary"
            icon={<Edit className="w-5 h-5" />}
            onClick={() => showModal(record)}
          />
          <Button
            variant="link"
            color="danger"
            icon={<Trash className="w-5 h-5" />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex mb-4 justify-end space-x-4">
        <div className="w-96">
          <Input
            placeholder="Search vendors..."
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            prefix={<Search className="w-5 h-5" />}
            size="medium"
          />
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => showModal()}
        >
          Add New Vendor
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Dashboard Cards */}
        {[
          {
            title: "Total Vendors",
            count: vendors.length,
            icon: <Store className="w-8 h-8 text-blue-600" />,
          },
          {
            title: "Total Payables",
            count: "$0 DR",
            icon: <TrendingDown className="w-8 h-8 text-red-600" />,
          },
          {
            title: "Total Receivables",
            count: "$22,000 CR",
            icon: <TrendingUp className="w-8 h-8 text-green-600" />,
          },
          {
            title: "Active Vendors",
            count: vendors.filter((vendor) => vendor.status).length,
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
      <div className="bg-white p-1 rounded-lg shadow">
        <div className="flex p-3 justify-between items-center mb-4">
          <div className="text-lg font-semibold">
            Vendors List ({vendors.length})
          </div>
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
          pagination={{ pageSize: 10 }}
          rowSelection={rowSelection}
        />
      </div>
      <Modal
        title={
          <div className="flex items-center">
            <span className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mr-2">
              <Store className="w-6 h-6 text-blue-600" />
            </span>
            Add New Vendor
          </div>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        className="min-w-[400px]"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4 mb-0">
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
                <Select.Option value="airline">Airline</Select.Option>
                <Select.Option value="hotel">Hotel</Select.Option>
                <Select.Option value="transport">Transport</Select.Option>
                <Select.Option value="tour-operator">
                  Tour Operator
                </Select.Option>
                <Select.Option value="other">Other</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-0">
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
          <div className="grid grid-cols-2 gap-4 mb-0">
            <Form.Item
              label="Email *"
              name="email"
              rules={[{ required: true, message: "Enter email!" }]}
            >
              <Input placeholder="Enter email address" />
            </Form.Item>
            <Form.Item
              label="Address *"
              name="location"
              rules={[{ required: true, message: "Enter address!" }]}
            >
              <Input placeholder="Enter address" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <Form.Item label="Status" name="status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
          <div className="flex justify-end space-x-4 mt-4">
            <Button
              onClick={handleCancel}
              className="bg-gray-200 text-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
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
