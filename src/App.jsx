// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { SidebarProvider } from "./context/SidebarContext";
import { ThemeProvider } from "./context/ThemeContext";
import AirlineCodesPage from "./pages/AirlinesCode";
import VendorsPage from "./pages/Vendors";
import NewServices from "./pages/NewServices";
import LedgerComponent from "./pages/Ledger";
import CustomersPage from "./pages/Customer";
import UsersPage from "./pages/Users";
import SalesReport from "./pages/SalesReport";
import ProfilePage from "./pages/Profile";

function App() {
  return (
    <SidebarProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Main Layout is used for all pages */}
            <Route path="/" element={<Layout />}>
              {/* Define child routes for different pages */}
              <Route index element={<Home />} />
              <Route
                path="/airline-codes"
                index
                element={<AirlineCodesPage />}
              />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/new-services" element={<NewServices />} />
              <Route path="/ledger" element={<LedgerComponent />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/sales-report" element={<SalesReport />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </SidebarProvider>
  );
}

export default App;
