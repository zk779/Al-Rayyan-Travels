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
  DatePicker,
} from "antd";
import { Edit, Trash, Plus, Search } from "lucide-react";
import dayjs from "dayjs";

const VendorsPage = () => {
  const [vendors, setVendors] = useState([
    {
      id: 1,
      date: "01-01-2025",
      name: "Global Supplies",
      type: "Credit",
      status: true,
    },
    {
      id: 2,
      date: "15-02-2025",
      name: "Tech Distributors",
      type: "Debit",
      status: true,
    },
    {
      id: 3,
      date: "30-03-2025",
      name: "Local Traders",
      type: "Credit",
      status: false,
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState(vendors);
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const handleSearch = (value) => {
    setSearchText(value);
    setFilteredData(
      vendors.filter((vendor) =>
        vendor.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const showModal = (vendor = null) => {
    setIsModalOpen(true);
    setIsEditModal(!!vendor);
    setCurrentVendor(vendor);
    form.setFieldsValue(
      vendor
        ? { ...vendor, date: dayjs(vendor.date, "DD-MM-YYYY") }
        : { status: true }
    );
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const updateData = (newVendors) => {
    setVendors(newVendors);
    setFilteredData(
      newVendors.filter((vendor) =>
        vendor.name.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        date: values.date.format("DD-MM-YYYY"),
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
    { title: "Sr", key: "sr", render: (_, __, index) => index + 1 },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) =>
        new Date(a.date.split("-").reverse().join("-")) -
        new Date(b.date.split("-").reverse().join("-")),
    },
    {
      title: "Vendor Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Vendor Type",
      dataIndex: "type",
      key: "type",
      filters: [
        { text: "Credit", value: "Credit" },
        { text: "Debit", value: "Debit" },
      ],
      onFilter: (value, record) => record.type === value,
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
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </Button>
          <Button
            variant="link"
            color="danger"
            icon={<Trash className="w-5 h-5" />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div className="p-6 bg-white text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <Space>
          <Input
            placeholder="Search Vendor Name"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            prefix={<Search className="w-5 h-5" />}
            className="w-72"
          />
          <Button
            type="primary"
            icon={<Plus className="w-5 h-5 mr-2" />}
            onClick={() => showModal()}
            className="flex items-center bg-blue-500 hover:bg-blue-600"
          >
            New Vendor
          </Button>
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
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        rowSelection={rowSelection}
        rowClassName="bg-white"
      />
      <Modal
        title={isEditModal ? "Edit Vendor" : "Add New Vendor"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Vendor Name"
            name="name"
            rules={[
              { required: true, message: "Enter vendor name!" },
              { max: 50, message: "Max 50 characters!" },
            ]}
          >
            <Input placeholder="e.g., Global Supplies" />
          </Form.Item>
          <Form.Item
            label="Vendor Type"
            name="type"
            rules={[{ required: true, message: "Select vendor type!" }]}
          >
            <Select placeholder="Select type">
              <Select.Option value="Credit">Credit</Select.Option>
              <Select.Option value="Debit">Debit</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: "Select date!" }]}
          >
            <DatePicker
              format="DD-MM-YYYY"
              placeholder="e.g., 01-01-2025"
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="Status" name="status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {isEditModal ? "Save" : "Add"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VendorsPage;
