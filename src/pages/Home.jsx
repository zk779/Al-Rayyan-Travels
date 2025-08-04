import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  TrendingUp,
  Send,
  AlertCircle,
  Plus,
  ScrollText,
  PieChart,
  ChevronRight,
  SaudiRiyal,
  CheckCircle,
  Calendar,
  User,
  Wallet,
  TrendingUpIcon,
  DollarSign,
  Calendar1,
  Plane,
  Users,
  StoreIcon,
} from "lucide-react";
import { Table, Tabs } from "antd";
import PieChartComponent from "../components/PieChart";
import LineChartComponent from "../components/LineChartComponent";

const Dashboard = () => {
  const location = useLocation();
  const [activePath, setActivePath] = useState(location.pathname);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalSaleToday: 12345,
    totalInvoicesCount: 400,
    totalInvoicesTodayCount: 40,
    totalItemsCount: 100,
    vatPercentage: 15,
  });

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  const statsData = [
    {
      key: "payments",
      label: "Payments",
      icon: <SaudiRiyal size={20} />,
      items: [
        {
          title: "Total Due",
          value: dashboardStats.totalDue || 0,
          icon: <Wallet size={20} />,
          color: "bg-gradient-to-br from-blue-500 to-indigo-900",
        },
        {
          title: "Total Paid Payments",
          value: dashboardStats.totalPaidPayments || 0,
          icon: <TrendingUpIcon size={20} />,
          color: "bg-gradient-to-br from-blue-500 to-indigo-900",
        },
      ],
    },
    {
      key: "profit",
      label: "Profit",
      icon: <DollarSign size={20} />,
      items: [
        {
          title: "Profit on Air",
          value: dashboardStats.profitOnAir || 0,
          icon: <SaudiRiyal size={20} />,
          color: "bg-gradient-to-br from-blue-500 to-indigo-900",
        },
        {
          title: "Profit Total",
          value: dashboardStats.profitTotal || 0,
          icon: <SaudiRiyal size={20} />,
          color: "bg-gradient-to-br from-blue-500 to-indigo-900",
        },
      ],
    },
    {
      key: "counts",
      label: "Counts",
      icon: <CheckCircle size={20} />,
      items: [
        {
          title: "No of Airline Codes",
          value: dashboardStats.airlineCodesCount || 0,
          icon: <Plane size={20} />,
          color: "bg-gradient-to-br from-blue-500 to-indigo-900",
        },
        {
          title: "No of Vendors",
          value: dashboardStats.vendorsCount || 0,
          icon: <StoreIcon size={20} />,
          color: "bg-gradient-to-br from-blue-500 to-indigo-900",
        },
      ],
    },
  ];

  const quickActions = [
    {
      title: "Add Expense",
      to: "/items",
      icon: <Plus size={18} />,
      color: "bg-gradient-to-br from-blue-500 to-blue-900 hover:bg-blue-700",
    },
    {
      title: "Manage Sales",
      to: "/manage-invoice",
      icon: <ScrollText size={18} />,
      color: "bg-gradient-to-br from-green-600 to-gray-600 hover:bg-green-700",
    },
    {
      title: "Generate Report",
      to: "/report",
      icon: <PieChart size={18} />,
      color:
        "bg-gradient-to-tr from-purple-600 via-indigo-600 to-gray-800 hover:bg-indigo-700",
    },
  ];

  const columns = [
    {
      title: "Invoice",
      dataIndex: "docNo",
      key: "docNo",
    },
    {
      title: "Client",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Amount",
      dataIndex: "grandTotal",
      key: "grandTotal",
      render: (amount) => (
        <div className="flex items-center gap-1">
          <SaudiRiyal size={20} />
          {amount.toFixed(2)}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Link
          to={`/edit-invoice/${record._id}`}
          className="text-blue-600 hover:text-blue-900 flex items-center"
        >
          View <ChevronRight size={16} className="ml-1" />
        </Link>
      ),
    },
  ];

  const userInfo = {
    name: "Mudassar Javed",
    email: "mudassar.umar89@gmail.com",
    role: "Admin",
    phone: "0511747179",
    status: "Active",
  };

  return (
    <div className="flex-1 p-6 transition-all duration-300 ease-in-out">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your invoices and track payments
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            to={"/new-sale"}
            className="bg-gradient-primary hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
          >
            <Plus className="mr-2" size={16} />
            New Sale
          </Link>
        </div>
      </div>

      {/* Stats Cards */}

      <Tabs defaultActiveKey="payments" className="ant-tabs-light">
        {statsData.map((tab) => (
          <Tabs.TabPane
            key={tab.key}
            tab={
              <div className="flex items-center gap-2">
                {tab.icon}
                <span>{tab.label}</span>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {tab.items.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {stat.title}
                      </p>
                      <h3 className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-2">
                        {stat.icon}
                        <span className="font-bold text-gray-800">
                          {stat.value}
                        </span>
                      </h3>
                    </div>
                    <div className={`${stat.color} p-2 rounded-lg text-white`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Tabs.TabPane>
        ))}
      </Tabs>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.to}
            className={`${action.color} text-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center`}
          >
            <div className="mb-2">{action.icon}</div>
            <span className="text-sm font-medium">{action.title}</span>
          </Link>
        ))}
      </div>
      <div className="h-96">
        <LineChartComponent />
      </div>

      {/* Recent Invoices Table and Shop Settings + Pie Chart in same row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Invoices
          </h2>
          <Table
            columns={columns}
            dataSource={recentInvoices}
            rowKey="_id"
            pagination={false}
            loading={loading}
            scroll={{ x: 800 }}
          />
        </div>

        {/* Shop Settings and Pie Chart */}
        <div className="space-y-6">
          <div className="bg-gradient-to-tl from-green-500 to-emerald-900 text-white p-5 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <User />
              User's Information{" "}
            </h3>
            <div className="space-y-3">
              <div className="text-lg font-medium">{userInfo.name}</div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{userInfo.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Role:</span>
                <span className="text-sm">{userInfo.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Phone:</span>
                <span className="text-sm">{userInfo.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userInfo.status === "Active"
                      ? "bg-green-400 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {userInfo.status}
                </span>
              </div>
            </div>
            <button className="w-full mt-6 bg-white text-blue-700 hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-200 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105">
              Edit Profile
            </button>
          </div>

          {/* Pie Chart */}
          <PieChartComponent />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
