import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { SidebarProvider } from "./context/SidebarContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext"; // ✅ ADD THIS

import AirlineCodesPage from "./pages/AirlinesCode";
import VendorsPage from "./pages/Vendors";
import NewServices from "./pages/NewServices";
import LedgerComponent from "./pages/Ledger";
import CustomersPage from "./pages/Customer";
import UsersPage from "./pages/Users";
import SalesReport from "./pages/SalesReport";
import ProfilePage from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Expense from "./pages/Expense";
import ReportPage from "./pages/ReportPage";
import LoginPage from "./pages/Login";
import ProtectedRoutes from "./ProtectedRoutes";
import NewPayments from "./pages/NewPayments";
import EditSaleComponent from "./pages/EditServices";
import PaymentPage from "./pages/Payments";

function App() {
	return (
		<SidebarProvider>
			<ThemeProvider>
				<AuthProvider>
					<Router>
						<Routes>
							{/* Main Layout is used for all pages */}
							<Route path="/" element={<Layout />}>
								<Route index element={<Home />} />

								{/* ✅ Login */}
								<Route path="login" element={<LoginPage />} />

								<Route element={<ProtectedRoutes />}>
									<Route path="dashboard" element={<Dashboard />} />
									<Route path="airline-codes" element={<AirlineCodesPage />} />
									<Route path="vendors" element={<VendorsPage />} />
									<Route path="new-services" element={<NewServices />} />
									<Route path="edit-services/:saleId" element={<EditSaleComponent />} />
									<Route path="manage-payments" element={<PaymentPage />} />
									<Route path="ledger" element={<LedgerComponent />} />
									<Route path="customers" element={<CustomersPage />} />
									<Route path="users" element={<UsersPage />} />
									<Route path="sales-report" element={<SalesReport />} />
									<Route path="new-payments" element={<NewPayments />} />
									<Route path="expenses" element={<Expense />} />
									<Route path="profile" element={<ProfilePage />} />
									<Route path="report" element={<ReportPage />} />
								</Route>
							</Route>
						</Routes>
					</Router>
				</AuthProvider>
			</ThemeProvider>
		</SidebarProvider>
	);
}

export default App;
