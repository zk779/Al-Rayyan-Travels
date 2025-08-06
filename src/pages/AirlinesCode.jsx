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
} from "antd";
import { Edit, Trash, Plus, Search, Plane, CheckCheckIcon } from "lucide-react";

const AirlineCodesPage = () => {
  const [airlineCodes, setAirlineCodes] = useState([
    {
      id: 1,
      code: "AA",
      iataName: "AA",
      name: "American Airlines",
      status: true,
    },
    { id: 2, code: "DL", iataName: "DL", name: "Delta Airlines", status: true },
    {
      id: 3,
      code: "UA",
      iataName: "UA",
      name: "United Airlines",
      status: false,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentCode, setCurrentCode] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState(airlineCodes);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Search functionality
  const handleSearch = (value) => {
    setSearchText(value);
    setFilteredData(
      airlineCodes.filter(
        (code) =>
          code.code.toLowerCase().includes(value.toLowerCase()) ||
          code.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  // Modal handling for editing and adding codes
  const showModal = (code = null) => {
    setIsModalOpen(true);
    setIsEditModal(!!code);
    setCurrentCode(code);
    form.setFieldsValue(code || { status: true });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const updateData = (newCodes) => {
    setAirlineCodes(newCodes);
    setFilteredData(
      newCodes.filter(
        (code) =>
          code.code.toLowerCase().includes(searchText.toLowerCase()) ||
          code.name.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const newCodes = isEditModal
        ? airlineCodes.map((code) =>
            code.id === currentCode.id ? { ...code, ...values } : code
          )
        : [...airlineCodes, { id: Date.now(), ...values }];
      updateData(newCodes);
      message.success(
        `Airline code ${isEditModal ? "updated" : "added"} successfully!`
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
      title: "Delete this airline code?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        updateData(airlineCodes.filter((code) => code.id !== id));
        message.success("Airline code deleted!");
      },
    });

  const handleDeleteSelected = () =>
    Modal.confirm({
      title: "Delete selected airline codes?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        updateData(
          airlineCodes.filter((code) => !selectedRowKeys.includes(code.id))
        );
        message.success("Selected airline codes deleted!");
        setSelectedRowKeys([]);
      },
    });

  const handleStatusToggle = (id, checked) => {
    const newCodes = airlineCodes.map((code) =>
      code.id === id ? { ...code, status: checked } : code
    );
    updateData(newCodes);
    message.success(
      `Airline status updated to ${checked ? "Active" : "Inactive"}`
    );
  };

  // Define columns for the table
  const columns = [
    { title: "Sr", key: "sr", render: (_, __, index) => index + 1 },
    {
      title: "Airline Code",
      dataIndex: "code",
      key: "code",
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: "IATA Name",
      dataIndex: "iataName",
      key: "iataName",
      sorter: (a, b) => a.iataName.localeCompare(b.iataName),
    },
    {
      title: "Airline Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
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
            className="text-red-600 hover:text-red-800"
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
        <h1 className="text-2xl font-bold">Airline Codes</h1>
        <Space>
          <Input
            placeholder="Search Airline Code"
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
            New Code
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

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        {/* Dashboard Cards */}
        {[
          {
            title: "Total Airline Codes",
            count: airlineCodes.length,
            icon: <Plane className="w-8 h-8 text-blue-600" />,
          },
          {
            title: "Active Airlines",
            count: airlineCodes.filter((airlineCodes) => airlineCodes.status)
              .length,
            icon: <CheckCheckIcon className="w-8 h-8 text-blue-600" />,
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
            Airline Codes List ({airlineCodes.length})
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
        title={isEditModal ? "Edit Airline Code" : "Add New Airline Code"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-0">
            <Form.Item
              label="Airline Code"
              name="code"
              rules={[{ required: true, message: "Enter airline code!" }]}
            >
              <Input placeholder="e.g., AA" />
            </Form.Item>
            <Form.Item
              label="IATA Name"
              name="iataName"
              rules={[{ required: true, message: "Enter IATA name!" }]}
            >
              <Input placeholder="e.g., AA" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-0">
            <Form.Item
              label="Airline Name"
              name="name"
              rules={[{ required: true, message: "Enter airline name!" }]}
            >
              <Input placeholder="e.g., American Airlines" />
            </Form.Item>
            <Form.Item label="Status" name="status" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </div>

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

export default AirlineCodesPage;
