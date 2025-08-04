import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Register Chart.js components and datalabels plugin
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const PieChart = () => {
  const [chartData, setChartData] = useState({
    labels: ["Vendor 1", "Vendor 2", "Vendor 3", "Vendor 4", "Vendor 5"],
    datasets: [
      {
        data: [10, 20, 30, 25, 15], // Static data for now
        backgroundColor: [
          "rgba(54, 162, 235, 0.8)", // Sky Blue
          "rgba(255, 99, 132, 0.8)", // Vibrant Red
          "rgba(255, 206, 86, 0.8)", // Warm Yellow
          "rgba(75, 192, 192, 0.8)", // Teal
          "rgba(153, 102, 255, 0.8)", // Purple
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 2,
        hoverOffset: 20,
      },
    ],
  });

  // Chart options for a modern look with improved datalabels
  const options = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#ffffff",
          font: {
            size: 12,
            family: "Inter, sans-serif",
          },
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: { size: 16, family: "Inter, sans-serif" },
        bodyFont: { size: 14, family: "Inter, sans-serif" },
        padding: 12,
        cornerRadius: 8,
      },
      datalabels: {
        color: "#ffffff",
        font: {
          size: 10, // Reduced font size for better fit
          family: "Inter, sans-serif",
          weight: "bold",
        },
        formatter: (value, context) => {
          return context.chart.data.labels[context.dataIndex];
        },
        textAlign: "center",
        anchor: "center", // Adjusted to end of segment for better readability
        align: "end",
        offset: 15, // Added offset to prevent overlap
        clamp: true, // Ensures labels stay within chart bounds
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
    },
    maintainAspectRatio: false,
    responsive: true,
    aspectRatio: 1, // Ensures a circular shape
  };

  return (
    <div className="bg-gradient-to-br from-blue-800 to-gray-900 p-6 rounded-2xl shadow-xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">
        Vendors with Highest Ticket Volume
      </h2>
      <div className="h-72">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
};

export default PieChart;
