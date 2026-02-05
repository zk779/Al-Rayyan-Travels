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
  Tag,
  Tooltip,
  Badge,
  Dropdown,
  Select,
  Card,
  Statistic,
  Empty,
} from "antd";
import {
  Edit,
  Trash,
  Plus,
  Search,
  Plane,
  CheckCheck,
  XCircle,
  MoreVertical,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Globe,
  Award,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ======================== API Helper ========================
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

// ======================== Data Transformers ========================
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
  icaoCode: a.icao_code ?? "",
  country: a.country_territory ?? "",
  status: normalizeStatus(a.status),
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
});

const toPayload = (values) => ({
  airlineName: values.name?.trim(),
  iataName: values.iataName?.trim()?.toUpperCase(),
  airlineCode: values.code?.trim(),
  icao_code: values.icaoCode?.trim()?.toUpperCase(),
  country_territory: values.country?.trim(),
  status: !!values.status,
});

// ======================== Main Component ========================
const AirlineCodesPage = () => {
  const [airlineCodes, setAirlineCodes] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [currentCode, setCurrentCode] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  // ======================== Fetch Airlines ========================
  const fetchAirlines = async (showLoader = true) => {
    if (showLoader) setLoadingList(true);
    else setRefreshing(true);
    
    try {
      const res = await apiRequest("/api/airlines");
      setAirlineCodes((res?.data || []).map(toUi));
      if (!showLoader) message.success("Data refreshed successfully!");
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAirlines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ======================== Computed Values ========================
  const countries = useMemo(() => {
    const uniqueCountries = [...new Set(airlineCodes.map((a) => a.country))].filter(Boolean);
    return uniqueCountries.sort();
  }, [airlineCodes]);

  const filteredData = useMemo(() => {
    const q = searchText.toLowerCase();
    return airlineCodes.filter((c) => {
      const matchesSearch =
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.iataName || "").toLowerCase().includes(q) ||
        (c.icaoCode || "").toLowerCase().includes(q) ||
        (c.country || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.status) ||
        (statusFilter === "inactive" && !c.status);

      const matchesCountry =
        countryFilter === "all" || c.country === countryFilter;

      return matchesSearch && matchesStatus && matchesCountry;
    });
  }, [airlineCodes, searchText, statusFilter, countryFilter]);

  const stats = useMemo(() => {
    const total = airlineCodes.length;
    const active = airlineCodes.filter((x) => x.status).length;
    const inactive = total - active;
    const countriesCount = new Set(airlineCodes.map((a) => a.country).filter(Boolean)).size;
    return { total, active, inactive, countriesCount };
  }, [airlineCodes]);

  // ======================== Modal Handlers ========================
  const showModal = (row = null) => {
    setIsModalOpen(true);
    setIsEditModal(!!row);
    setCurrentCode(row);

    form.setFieldsValue(
      row
        ? {
            code: row.code,
            iataName: row.iataName,
            name: row.name,
            icaoCode: row.icaoCode,
            country: row.country,
            status: row.status,
          }
        : {
            code: "",
            iataName: "",
            name: "",
            icaoCode: "",
            country: "",
            status: true,
          }
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

        message.success("Airline updated successfully!");
      } else {
        const res = await apiRequest("/api/airlines", {
          method: "POST",
          body: payload,
        });

        const created = toUi(res?.data || {});
        setAirlineCodes((prev) => [created, ...prev]);

        message.success("Airline added successfully!");
      }

      handleCancel();
    } catch (e) {
      message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ======================== Delete Handlers ========================
  const handleDelete = (id) =>
    Modal.confirm({
      title: "Delete Airline",
      content: "Are you sure you want to delete this airline? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await apiRequest(`/api/airlines/${id}`, { method: "DELETE" });
          setAirlineCodes((prev) => prev.filter((x) => x.id !== id));
          setSelectedRowKeys((prev) => prev.filter((x) => x !== id));
          message.success("Airline deleted successfully!");
        } catch (e) {
          message.error(e.message);
        }
      },
    });

  const handleDeleteSelected = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select airlines to delete");
      return;
    }

    Modal.confirm({
      title: `Delete ${selectedRowKeys.length} Airlines`,
      content: `Are you sure you want to delete ${selectedRowKeys.length} selected airline(s)? This action cannot be undone.`,
      okText: "Delete All",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await apiRequest("/api/airlines/deleteMany", {
            method: "DELETE",
            body: { ids: selectedRowKeys },
          });
          setAirlineCodes((prev) =>
            prev.filter((x) => !selectedRowKeys.includes(x.id))
          );
          setSelectedRowKeys([]);
          message.success(`${selectedRowKeys.length} airline(s) deleted successfully!`);
        } catch (e) {
          message.error(e.message);
        }
      },
    });
  };

  // ======================== Status Handlers ========================
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
      message.success(`Status updated to ${checked ? "Active" : "Inactive"}`);
    } catch (e) {
      // Revert if failed
      setAirlineCodes((prev) =>
        prev.map((x) => (x.id === record.id ? { ...x, status: !checked } : x))
      );
      message.error(e.message);
    }
  };

  const handleBulkStatusChange = (targetStatus) => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select airlines to update");
      return;
    }

    Modal.confirm({
      title: `${targetStatus ? "Activate" : "Deactivate"} ${selectedRowKeys.length} Airlines`,
      content: `Are you sure you want to ${targetStatus ? "activate" : "deactivate"} ${selectedRowKeys.length} selected airline(s)?`,
      okText: targetStatus ? "Activate" : "Deactivate",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await apiRequest("/api/airlines/status/set-selected", {
            method: "PATCH",
            body: { ids: selectedRowKeys, targetStatus },
          });

          setAirlineCodes((prev) =>
            prev.map((x) =>
              selectedRowKeys.includes(x.id) ? { ...x, status: targetStatus } : x
            )
          );
          setSelectedRowKeys([]);
          message.success(`${selectedRowKeys.length} airline(s) ${targetStatus ? "activated" : "deactivated"}!`);
        } catch (e) {
          message.error(e.message);
        }
      },
    });
  };

  // ======================== Table Actions Menu ========================
  const getActionsMenu = (record) => ({
    items: [
      {
        key: "edit",
        label: "Edit",
        icon: <Edit className="w-4 h-4" />,
        onClick: () => showModal(record),
      },
      {
        key: "toggle",
        label: record.status ? "Mark as Inactive" : "Mark as Active",
        icon: record.status ? (
          <XCircle className="w-4 h-4" />
        ) : (
          <CheckCheck className="w-4 h-4" />
        ),
        onClick: () => handleStatusToggle(record, !record.status),
      },
      {
        type: "divider",
      },
      {
        key: "delete",
        label: "Delete",
        danger: true,
        icon: <Trash className="w-4 h-4" />,
        onClick: () => handleDelete(record.id),
      },
    ],
  });

  // ======================== Table Columns ========================
  const columns = [
    {
      title: "#",
      key: "sr",
      width: 60,
      fixed: "left",
      render: (_, __, index) => (
        <span className="text-gray-600 font-medium">{index + 1}</span>
      ),
    },
    {
      title: "Airline Code",
      dataIndex: "code",
      key: "code",
      width: 130,
      sorter: (a, b) => a.code.localeCompare(b.code),
      render: (code) => (
        <Tag color="blue" className="font-mono font-semibold">
          {code}
        </Tag>
      ),
    },
    {
      title: "IATA",
      dataIndex: "iataName",
      key: "iataName",
      width: 100,
      sorter: (a, b) => (a.iataName || "").localeCompare(b.iataName || ""),
      render: (iata) =>
        iata ? (
          <Tag color="cyan" className="font-mono">
            {iata}
          </Tag>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "ICAO",
      dataIndex: "icaoCode",
      key: "icaoCode",
      width: 100,
      sorter: (a, b) => (a.icaoCode || "").localeCompare(b.icaoCode || ""),
      render: (icao) =>
        icao ? (
          <Tag color="purple" className="font-mono">
            {icao}
          </Tag>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Airline Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => (
        <span className="font-medium text-gray-800">{name}</span>
      ),
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      width: 160,
      sorter: (a, b) => (a.country || "").localeCompare(b.country || ""),
      render: (country) =>
        country ? (
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{country}</span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
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
          className={status ? "bg-green-500" : ""}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Dropdown menu={getActionsMenu(record)} trigger={["click"]}>
          <Button
            type="text"
            icon={<MoreVertical className="w-4 h-4" />}
            className="hover:bg-gray-100"
          />
        </Dropdown>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  // ======================== Bulk Actions Menu ========================
  const bulkActionsMenu = {
    items: [
      {
        key: "activate",
        label: "Activate Selected",
        icon: <CheckCheck className="w-4 h-4" />,
        onClick: () => handleBulkStatusChange(true),
      },
      {
        key: "deactivate",
        label: "Deactivate Selected",
        icon: <XCircle className="w-4 h-4" />,
        onClick: () => handleBulkStatusChange(false),
      },
      {
        type: "divider",
      },
      {
        key: "delete",
        label: "Delete Selected",
        danger: true,
        icon: <Trash className="w-4 h-4" />,
        onClick: handleDeleteSelected,
      },
    ],
  };

  // ======================== Clear Filters ========================
  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setCountryFilter("all");
    message.info("Filters cleared");
  };

  const hasActiveFilters = searchText || statusFilter !== "all" || countryFilter !== "all";

  // ======================== Render ========================
  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto w-full space-y-6">
        {/* ========== Header ========== */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <Plane className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Airline Management
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Manage airline codes, IATA/ICAO identifiers, and status
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Tooltip title="Refresh Data">
                <Button
                  icon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />}
                  onClick={() => fetchAirlines(false)}
                  loading={refreshing}
                  className="hover:border-blue-400"
                />
              </Tooltip>
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => showModal()}
                size="large"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
              >
                Add Airline
              </Button>
            </div>
          </div>
        </div>

        {/* ========== Statistics Cards ========== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Total Airlines",
              count: stats.total,
              icon: <Plane className="w-6 h-6" />,
              color: "blue",
              bgColor: "bg-blue-50",
              textColor: "text-blue-600",
            },
            {
              title: "Active Airlines",
              count: stats.active,
              icon: <CheckCheck className="w-6 h-6" />,
              color: "green",
              bgColor: "bg-green-50",
              textColor: "text-green-600",
            },
            {
              title: "Inactive Airlines",
              count: stats.inactive,
              icon: <XCircle className="w-6 h-6" />,
              color: "red",
              bgColor: "bg-red-50",
              textColor: "text-red-600",
            },
            {
              title: "Countries",
              count: stats.countriesCount,
              icon: <Globe className="w-6 h-6" />,
              color: "purple",
              bgColor: "bg-purple-50",
              textColor: "text-purple-600",
            },
          ].map(({ title, count, icon, bgColor, textColor }, idx) => (
            <Card
              key={idx}
              className="hover:shadow-lg transition-all duration-300 border-gray-100"
              bordered={false}
            >
              <Statistic
                title={<span className="text-gray-600 font-medium">{title}</span>}
                value={count}
                prefix={
                  <div className={`${bgColor} ${textColor} p-2 rounded-lg inline-block`}>
                    {icon}
                  </div>
                }
                valueStyle={{ fontSize: "28px", fontWeight: "bold", marginLeft: "12px" }}
              />
            </Card>
          ))}
        </div>

        {/* ========== Filters & Search ========== */}
        <Card className="shadow-sm border-gray-100" bordered={false}>
          <div className="flex flex-col lg:flex-row gap-3">
            <Input
              placeholder="Search by code, name, IATA, ICAO, or country..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<Search className="w-4 h-4 text-gray-400" />}
              allowClear
              size="large"
              className="flex-1"
            />

            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              size="large"
              className="w-full lg:w-40"
              options={[
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />

            <Select
              value={countryFilter}
              onChange={setCountryFilter}
              size="large"
              className="w-full lg:w-48"
              showSearch
              placeholder="Filter by country"
              options={[
                { label: "All Countries", value: "all" },
                ...countries.map((c) => ({ label: c, value: c })),
              ]}
            />

            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                size="large"
                icon={<Filter className="w-4 h-4" />}
              >
                Clear
              </Button>
            )}
          </div>

          {selectedRowKeys.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge count={selectedRowKeys.length} showZero color="blue" />
                <span className="text-blue-700 font-medium">
                  {selectedRowKeys.length} airline(s) selected
                </span>
              </div>
              <Dropdown menu={bulkActionsMenu} trigger={["click"]}>
                <Button type="primary" icon={<MoreVertical className="w-4 h-4" />}>
                  Bulk Actions
                </Button>
              </Dropdown>
            </div>
          )}
        </Card>

        {/* ========== Data Table ========== */}
        <Card
          className="shadow-sm border-gray-100"
          bordered={false}
          title={
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">
                Airlines List ({filteredData.length})
              </span>
            </div>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            loading={loadingList}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} airline(s)`,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
            }}
            rowSelection={rowSelection}
            scroll={{ x: 1200 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No airlines found"
                >
                  <Button type="primary" onClick={() => showModal()}>
                    Add First Airline
                  </Button>
                </Empty>
              ),
            }}
            rowClassName="hover:bg-gray-50 transition-colors"
          />
        </Card>

        {/* ========== Add/Edit Modal ========== */}
        <Modal
          title={
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Plane className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xl font-semibold">
                {isEditModal ? "Edit Airline" : "Add New Airline"}
              </span>
            </div>
          }
          open={isModalOpen}
          onCancel={handleCancel}
          footer={null}
          centered
          width={700}
          className="airline-modal"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="mt-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                label="Airline Code"
                name="code"
                rules={[
                  { required: true, message: "Please enter airline code" },
                  { pattern: /^\d+$/, message: "Code must be numeric" },
                ]}
              >
                <Input
                  placeholder="e.g., 495"
                  size="large"
                  maxLength={10}
                />
              </Form.Item>

              <Form.Item
                label="IATA Code"
                name="iataName"
                rules={[
                  { required: true, message: "Please enter IATA code" },
                  { len: 2, message: "IATA code must be 2 characters" },
                ]}
              >
                <Input
                  placeholder="e.g., L6"
                  size="large"
                  maxLength={2}
                  className="uppercase"
                />
              </Form.Item>

              <Form.Item
                label="ICAO Code"
                name="icaoCode"
                rules={[
                  { len: 3, message: "ICAO code must be 3 characters" },
                ]}
              >
                <Input
                  placeholder="e.g., MAI"
                  size="large"
                  maxLength={3}
                  className="uppercase"
                />
              </Form.Item>

              <Form.Item
                label="Country/Territory"
                name="country"
              >
                <Input
                  placeholder="e.g., Mauritania"
                  size="large"
                />
              </Form.Item>
            </div>

            <Form.Item
              label="Airline Name"
              name="name"
              rules={[
                { required: true, message: "Please enter airline name" },
                { min: 3, message: "Name must be at least 3 characters" },
              ]}
            >
              <Input
                placeholder="e.g., Mauritania Airlines International"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Status"
              name="status"
              valuePropName="checked"
            >
              <div className="flex items-center gap-3">
                <Switch
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                  defaultChecked
                />
                <span className="text-gray-500 text-sm">
                  Toggle to activate or deactivate this airline
                </span>
              </div>
            </Form.Item>

            <Form.Item className="mb-0 mt-6">
              <div className="flex gap-3 justify-end">
                <Button onClick={handleCancel} size="large">
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 min-w-[120px]"
                >
                  {isEditModal ? "Update" : "Create"}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default AirlineCodesPage;