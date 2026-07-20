import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { SidebarProvider } from "./context/SidebarContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

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
import PermissionRoute from "./PermissionRoute"; // ✅ ADD THIS
import Forbidden from "./pages/Forbidden"; // ✅ ADD THIS
import NewPayments from "./pages/NewPayments";
import EditSaleComponent from "./pages/EditServices";
import PaymentPage from "./pages/Payments";
import InvoicePrint from "./pages/InvoicePrint";
import EditRefundComponent from "./pages/EditRefund";
import BankAccountsPage from "./pages/BankAccounts";

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

								{/* ✅ 403 Forbidden — accessible to any authenticated user */}
								<Route path="403" element={<Forbidden />} />

								<Route element={<ProtectedRoutes />}>
									<Route path="dashboard" element={<Dashboard />} />

									<Route
										path="airline-codes"
										element={
											<PermissionRoute permission="AIRLINE_READ">
												<AirlineCodesPage />
											</PermissionRoute>
										}
									/>
									<Route
										path="vendors"
										element={
											<PermissionRoute permission="VENDOR_READ">
												<VendorsPage />
											</PermissionRoute>
										}
									/>
									<Route
										path="new-services"
										element={
											<PermissionRoute permission="SALE_CREATE">
												<NewServices />
											</PermissionRoute>
										}
									/>
									<Route
										path="edit-services/:saleId"
										element={
											<PermissionRoute permission="SALE_EDIT">
												<EditSaleComponent />
											</PermissionRoute>
										}
									/>
									<Route
										path="edit-refund/:refundId"
										element={
											<PermissionRoute permission="REFUND_EDIT">
												<EditRefundComponent />
											</PermissionRoute>
										}
									/>
									<Route
										path="manage-payments"
										element={
											<PermissionRoute permission="PAYMENT_READ">
												<PaymentPage />
											</PermissionRoute>
										}
									/>
									<Route
										path="invoice-print/:saleId"
										element={
											<PermissionRoute permission="SALE_READ">
												<InvoicePrint />
											</PermissionRoute>
										}
									/>
									<Route
										path="ledger"
										element={
											<PermissionRoute permission="LEDGER_READ">
												<LedgerComponent />
											</PermissionRoute>
										}
									/>
									<Route
										path="customers"
										element={
											<PermissionRoute permission="CUSTOMER_READ">
												<CustomersPage />
											</PermissionRoute>
										}
									/>
									<Route
										path="bank-accounts"
										element={
											<PermissionRoute permission="BRANCH_READ">
												<BankAccountsPage />
											</PermissionRoute>
										}
									/>
									<Route
										path="users"
										element={
											<PermissionRoute permission="USER_READ">
												<UsersPage />
											</PermissionRoute>
										}
									/>
									<Route
										path="sales-report"
										element={
											<PermissionRoute permission="REPORT_READ">
												<SalesReport />
											</PermissionRoute>
										}
									/>
									<Route
										path="new-payments"
										element={
											<PermissionRoute permission="PAYMENT_CREATE">
												<NewPayments />
											</PermissionRoute>
										}
									/>
									<Route
										path="expenses"
										element={
											<PermissionRoute permission="EXPENSE_READ">
												<Expense />
											</PermissionRoute>
										}
									/>
									<Route path="profile" element={<ProfilePage />} />
									<Route
										path="report"
										element={
											<PermissionRoute permission="REPORT_READ">
												<ReportPage />
											</PermissionRoute>
										}
									/>
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