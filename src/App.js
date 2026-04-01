import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import StockAuditHistory from "./pages/StockAuditHistory";

import Register from "./pages/Register";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import StockMovement from "./pages/StockMovement";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import StockHistory from "./pages/StockHistory";
import ActivityLog from "./pages/ActivityLog";
import PurchaseSuggestions from "./pages/PurchaseSuggestions";
import SelectEstablishment from "./pages/SelectEstablishment";
import StockTransfers from "./pages/StockTransfers";
import StockAudits from "./pages/StockAudits";
import StockAuditDetail from "./pages/StockAuditDetail";

import SidebarLayout from "./components/SidebarLayout";
import PrivateRoute from "./components/PrivateRoute";
import Users from "./pages/Users";

import { AppProvider } from "./context/AppContext";

import GlobalStyles from "./styles/GlobalStyles";
import { theme } from "./styles/theme";

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />

      <AppProvider>
        <BrowserRouter>
          <Toaster position="top-right" />

          <Routes>

            {/* ROTAS PUBLICAS */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/select-establishment" element={<SelectEstablishment />} />

            {/* ROTAS PROTEGIDAS */}
            <Route
              element={
                <PrivateRoute>
                  <SidebarLayout />
                </PrivateRoute>
              }
            >

              <Route path="/" element={<Dashboard />} />

              <Route path="users" element={<Users />} />

              <Route path="/products" element={<Products />} />

              <Route path="/suppliers" element={<Suppliers />} />

              <Route path="/purchase-orders" element={<PurchaseOrders />} />

              <Route path="/stock-history" element={<StockHistory />} />

              <Route path="/stock-movement" element={<StockMovement />} />

              <Route path="/activity-log" element={<ActivityLog />} />

              <Route path="/stock-audits" element={<StockAudits />} />

              <Route
                path="/stock-audits/history"
                element={<StockAuditHistory />}
              />

              <Route path="/stock-audits/:id" element={<StockAuditDetail />} />

              <Route path="/stock-transfers" element={<StockTransfers />} />

              <Route
                path="/purchase-suggestions"
                element={<PurchaseSuggestions />}
              />

            </Route>

          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;