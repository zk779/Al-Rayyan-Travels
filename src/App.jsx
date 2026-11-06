import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { SidebarProvider } from "./context/SidebarContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

import AirlineCodesPage from "./pages/AirlinesCode";
import VendorsPage from "./pages/Vendors";
import NewServices from "./pages/NewServices";
import { NewSalePage, NewRefundPage, NewVoidPage } from "./pages/NewServicePages";
import OtherServices from "./pages/OtherServices";
import OtherServiceInvoice from "./pages/OtherServiceInvoice";
import { NewOtherService, EditOtherService } from "./pages/OtherServiceFormPages";
import LedgerComponent from "./pages/Ledger";
import CustomersPage from "./pages/Customer";
import UsersPage from "./pages/Users";
import SalesReport from "./pages/SalesReport";
import ProfilePage from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Expense from "./pages/Expense";
import BalanceAdjustment from "./pages/BalanceAdjustment";
import NewHotelBooking from "./pages/NewHotelBooking";
import EditHotelBooking from "./pages/EditHotelBooking";
import ReportPage from "./pages/ReportPage";
import VatHome from "./pages/VatHome";
import VatReport from "./pages/VatReport";
import ReturnableVat from "./pages/ReturnableVat";
import LoginPage from "./pages/Login";
import ProtectedRoutes from "./ProtectedRoutes";
import PermissionRoute from "./PermissionRoute"; // ✅ ADD THIS
import Forbidden from "./pages/Forbidden"; // ✅ ADD THIS
import NewPayments from "./pages/NewPayments";
import EditSaleComponent from "./pages/EditServices";
import PaymentPage from "./pages/Payments";
import InvoicePrint from "./pages/InvoicePrint";
import CustomerInvoice from "./pages/CustomerInvoice";
import ViewInvoice from "./pages/ViewInvoice";
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
											<PermissionRoute any={["SALE_CREATE", "REFUND_CREATE"]}>
												<NewServices />
											</PermissionRoute>
										}
									/>
									<Route
										path="new-services/sale"
										element={
											<PermissionRoute permission="SALE_CREATE">
												<NewSalePage />
											</PermissionRoute>
										}
									/>
									<Route
										path="new-services/refund"
										element={
											<PermissionRoute permission="REFUND_CREATE">
												<NewRefundPage />
											</PermissionRoute>
										}
									/>
									<Route
										path="new-services/void"
										element={
											<PermissionRoute permission="SALE_CREATE">
												<NewVoidPage />
											</PermissionRoute>
										}
									/>
									<Route
										path="other-services"
										element={
											<PermissionRoute permission="SALE_READ">
												<OtherServices />
											</PermissionRoute>
										}
									/>
									<Route
										path="other-services/new"
										element={
											<PermissionRoute permission="SALE_CREATE">
												<NewOtherService />
											</PermissionRoute>
										}
									/>
									<Route
										path="other-services/:id/edit"
										element={
											<PermissionRoute permission="SALE_EDIT">
												<EditOtherService />
											</PermissionRoute>
										}
									/>
									<Route
										path="other-services/:id"
										element={
											<PermissionRoute permission="SALE_READ">
												<OtherServiceInvoice />
											</PermissionRoute>
										}
									/>
									<Route
										path="new-hotel-booking"
										element={
											<PermissionRoute permission="SALE_CREATE">
												<NewHotelBooking />
											</PermissionRoute>
										}
									/>
									<Route
										path="edit-hotel-booking/:invoiceId"
										element={
											<PermissionRoute permission="SALE_EDIT">
												<EditHotelBooking />
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
										path="customer-invoice/:saleId"
										element={
											<PermissionRoute permission="SALE_READ">
												<CustomerInvoice />
											</PermissionRoute>
										}
									/>
									<Route
										path="view-invoice/:invoiceId"
										element={
											<PermissionRoute permission="SALE_READ">
												<ViewInvoice />
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
										path="vat"
										element={
											<PermissionRoute permission="REPORT_READ">
												<VatHome />
											</PermissionRoute>
										}
									/>
									<Route
										path="vat/submit"
										element={
											<PermissionRoute permission="REPORT_READ">
												<VatReport />
											</PermissionRoute>
										}
									/>
									<Route
										path="vat/return"
										element={
											<PermissionRoute permission="REPORT_READ">
												<ReturnableVat />
											</PermissionRoute>
										}
									/>
									{/* Old address — keep bookmarks working */}
									<Route path="vat-report" element={<Navigate to="/vat" replace />} />
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
									<Route
										path="balance-adjustments"
										element={
											<PermissionRoute permission="BALANCE_ADJUSTMENT_READ">
												<BalanceAdjustment />
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