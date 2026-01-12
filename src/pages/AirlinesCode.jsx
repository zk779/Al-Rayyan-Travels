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
} from "antd";
import { Edit, Trash, Plus, Search, Plane, CheckCheck } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL; // e.g. http://localhost:5000

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
  status: normalizeStatus(a.status),
  createdAt: a.createdAt,
});

const toPayload = (values) => ({
  airlineName: values.name?.trim(),
  iataName: values.iataName?.trim(),
  airlineCode: values.code?.trim()?.toUpperCase(),
  status: !!values.status,
});

const AirlineCodesPage = () => {
  const [airlineCodes, setAirlineCodes] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentCode, setCurrentCode] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const fetchAirlines = async () => {
    setLoadingList(true);
    try {
      const res = await apiRequest("/api/airlines");
      setAirlineCodes((res?.data || []).map(toUi));
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchAirlines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredData = useMemo(() => {
    const q = searchText.toLowerCase();
    return airlineCodes.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.iataName || "").toLowerCase().includes(q)
    );
  }, [airlineCodes, searchText]);

  const stats = useMemo(() => {
    const total = airlineCodes.length;
    const active = airlineCodes.filter((x) => x.status).length;
    return { total, active };
  }, [airlineCodes]);

  const showModal = (row = null) => {
    setIsModalOpen(true);
    setIsEditModal(!!row);
    setCurrentCode(row);

    // keep your form keys (code, iataName, name, status)
    form.setFieldsValue(
      row
        ? {
            code: row.code,
            iataName: row.iataName,
            name: row.name,
            status: row.status,
          }
        : { code: "", iataName: "", name: "", status: true }
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
        const res = await apiRequest(`/api/airlines/${currentCode.id}`, {
          method: "PUT",
          body: payload,
        });

        const updated = toUi(res?.data || {});
        setAirlineCodes((prev) =>
          prev.map((x) => (x.id === updated.id ? updated : x))
        );

        message.success("Airline code updated successfully!");
      } else {
        const res = await apiRequest("/api/airlines", {
          method: "POST",
          body: payload,
        });

        const created = toUi(res?.data || {});
        setAirlineCodes((prev) => [created, ...prev]);

        message.success("Airline code added successfully!");
      }

      handleCancel();
    } catch (e) {
      message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) =>
    Modal.confirm({
      title: "Delete this airline code?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await apiRequest(`/api/airlines/${id}`, { method: "DELETE" });
          setAirlineCodes((prev) => prev.filter((x) => x.id !== id));
          setSelectedRowKeys((prev) => prev.filter((x) => x !== id));
          message.success("Airline code deleted!");
        } catch (e) {
          message.error(e.message);
        }
      },
    });

  const handleDeleteSelected = () =>
    Modal.confirm({
      title: "Delete selected airline codes?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        if (selectedRowKeys.length === 0) return;
        try {
          await Promise.all(
            selectedRowKeys.map((id) =>
              apiRequest(`/api/airlines/${id}`, { method: "DELETE" })
            )
          );
          setAirlineCodes((prev) =>
            prev.filter((x) => !selectedRowKeys.includes(x.id))
          );
          setSelectedRowKeys([]);
          message.success("Selected airline codes deleted!");
        } catch (e) {
          message.error(e.message);
        }
      },
    });

  const handleStatusToggle = async (record, checked) => {
    // Optimistic UI update
    setAirlineCodes((prev) =>
      prev.map((x) => (x.id === record.id ? { ...x, status: checked } : x))
    );

    try {
      await apiRequest(`/api/airlines/${record.id}`, {
        method: "PUT",
        body: toPayload({ ...record, status: checked }),
      });
      message.success(
        `Airline status updated to ${checked ? "Active" : "Inactive"}`
      );
    } catch (e) {
      // revert if failed
      setAirlineCodes((prev) =>
        prev.map((x) => (x.id === record.id ? { ...x, status: !checked } : x))
      );
      message.error(e.message);
    }
  };

  const columns = [
    { title: "Sr", key: "sr", width: 70, render: (_, __, index) => index + 1 },
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
      sorter: (a, b) => (a.iataName || "").localeCompare(b.iataName || ""),
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
          onChange={(checked) => handleStatusToggle(record, checked)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, record) => (
        <Space wrap>
          <Button
            type="link"
            icon={<Edit className="w-5 h-5" />}
            onClick={() => showModal(record)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
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
    <div className="w-full text-gray-900">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">Airline Codes</h1>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
            <Input
              placeholder="Search Airline Code"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<Search className="w-5 h-5" />}
              className="w-full sm:w-72"
            />

            <Button
              type="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => showModal()}
              className="w-full sm:w-auto flex items-center justify-center bg-blue-500 hover:bg-blue-600"
            >
              New Code
            </Button>

            {selectedRowKeys.length > 0 && (
              <Button
                danger
                onClick={handleDeleteSelected}
                icon={<Trash className="w-5 h-5" />}
                className="w-full sm:w-auto flex items-center justify-center"
              >
                Delete Selected
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "Total Airline Codes",
              count: stats.total,
              icon: <Plane className="w-8 h-8 text-blue-600" />,
            },
            {
              title: "Active Airlines",
              count: stats.active,
              icon: <CheckCheck className="w-8 h-8 text-blue-600" />,
            },
          ].map(({ title, count, icon }, idx) => (
            <div
              key={idx}
              className="bg-white p-4 sm:p-5 rounded-lg shadow flex items-center justify-between"
            >
              <div>
                <div className="text-gray-500 text-sm font-medium">{title}</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {count}
                </div>
              </div>
              <div className="flex items-center">{icon}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3">
            <div className="text-base sm:text-lg font-semibold">
              Airline Codes List ({airlineCodes.length})
            </div>

            {selectedRowKeys.length > 0 && (
              <Button
                danger
                onClick={handleDeleteSelected}
                icon={<Trash className="w-5 h-5" />}
                className="w-full sm:w-auto flex items-center justify-center"
              >
                Delete Selected
              </Button>
            )}
          </div>

          <div className="w-full overflow-x-auto">
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              loading={loadingList}
              pagination={{ pageSize: 10, responsive: true }}
              rowSelection={rowSelection}
              scroll={{ x: "max-content" }}
            />
          </div>
        </div>

        {/* Modal */}
        <Modal
          title={isEditModal ? "Edit Airline Code" : "Add New Airline Code"}
          open={isModalOpen}
          onCancel={handleCancel}
          footer={null}
          centered
          width={620}
          className="!w-[95vw] sm:!w-[620px]"
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-0">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-0">
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

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                {isEditModal ? "Save" : "Add"}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default AirlineCodesPage;
