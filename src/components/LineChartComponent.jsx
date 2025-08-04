import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChartComponent = () => {
  // State to handle the selected tab (Week, Month, Year)
  const [timeRange, setTimeRange] = useState("Month");

  // Sample sales data for different ranges (week, month, year)
  const salesData = {
    Week: {
      labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      data: [1500, 2000, 2500, 2300, 2200, 2800, 2900],
    },
    Month: {
      labels: [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "27",
        "28",
        "29",
        "30",
      ],
      data: [
        1500, 2000, 3000, 2500, 2300, 1900, 2800, 3100, 3500, 3200, 4000, 3800,
        4500, 4600, 4900, 5300, 5600, 5800, 5900, 6100, 6500, 6700, 6900, 7100,
        7400, 7500, 7800, 8000, 8100, 8200,
      ],
    },
    Year: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      data: [
        15000, 18000, 21000, 24000, 26000, 30000, 28000, 32000, 35000, 38000,
        40000, 45000,
      ],
    },
  };

  // Function to handle tab change
  const handleTabChange = (range) => {
    setTimeRange(range);
  };

  // Data for the selected time range (Week, Month, Year)
  const chartData = {
    labels: salesData[timeRange].labels,
    datasets: [
      {
        label: "Sales (SAR)",
        data: salesData[timeRange].data,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;

          // Create gradient from deep blue to light blue
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );
          gradient.addColorStop(0, "rgba(10, 76, 135, 0.8)"); // Deep blue (start of gradient)
          gradient.addColorStop(1, "rgba(76, 158, 217, 0.8)"); // Light blue (end of gradient)
          return gradient;
        },
        borderColor: "rgba(255, 255, 255, 1)", // White border for contrast
        borderWidth: 1,
        borderRadius: 8, // Rounded corners for sleek look
        hoverBackgroundColor: "rgba(3, 58, 91, 0.8)", // Dark navy blue for hover effect
        hoverBorderColor: "rgba(255, 255, 255, 1)", // White border on hover
        hoverBorderWidth: 2, // Thicker border on hover for emphasis
        textColor: "#ffffff", // White text for data labels
        // Data labels formatting
        datalabels: {
          color: "#0000", // White text for data labels
          font: {
            size: 14, // Adjust font size for readability
            weight: "bold", // Bold text for better contrast
          },
          formatter: (value) => `$${value}`, // Add the $ sign to the values
          align: "center", // Center the data labels inside the bars
          anchor: "center", // Position labels in the center of each bar
        },
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `${timeRange} Sales`,
        font: { size: 20, family: "'Inter', sans-serif" },
        color: "#333", // Title color
        padding: {
          top: 20,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: { size: 16 },
        bodyFont: { size: 14 },
        padding: 12,
        cornerRadius: 8,
        bodyColor: "#fff", // Tooltip body color
        titleColor: "#fff", // Tooltip title color
        displayColors: false,
      },
      legend: {
        position: "top",
        labels: {
          font: { size: 14, family: "'Inter', sans-serif" },
          color: "#555", // Legend label color
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: `${timeRange} Data`,
          font: { size: 16, family: "'Inter', sans-serif" },
          color: "#333", // Axis label color
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)", // Lighter grid lines for a modern feel
          lineWidth: 1,
        },
        ticks: {
          font: { size: 12, family: "'Inter', sans-serif" },
          color: "#333", // Ticks color
        },
      },
      y: {
        title: {
          display: true,
          text: "Sales in SAR",
          font: { size: 16, family: "'Inter', sans-serif" },
          color: "#333", // Axis label color
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)", // Lighter grid lines for a modern feel
          lineWidth: 1,
        },
        ticks: {
          beginAtZero: true,
          font: { size: 12, family: "'Inter', sans-serif" },
          color: "#333", // Ticks color
        },
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
    },
    maintainAspectRatio: false,
    responsive: true,
    aspectRatio: 1.5, // Aspect ratio for better layout
  };

  return (
    <div className="px-6 py-2 bg-white rounded-2xl shadow-xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Sales Data</h2>
        {/* Tab Navigation */}
        <div className="flex gap-4">
          {["Week", "Month", "Year"].map((range) => (
            <button
              key={range}
              onClick={() => handleTabChange(range)}
              className={`${
                timeRange === range
                  ? "bg-gradient-primary text-white"
                  : "bg-gradient-active text-gray-600"
              }  py-2 px-4 rounded-lg font-medium transition-all duration-200`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-72">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default BarChartComponent;
