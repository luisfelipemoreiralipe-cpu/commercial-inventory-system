import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import Register from "./pages/Register";
import Login from "./pages/login";
import { AppProvider } from './context/AppContext';
import GlobalStyles from './styles/GlobalStyles';
import { theme } from './styles/theme';
import SidebarLayout from './components/SidebarLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import StockHistory from './pages/StockHistory';
import ActivityLog from './pages/ActivityLog';
import PurchaseSuggestions from "./pages/PurchaseSuggestions";
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

            {/* ROTAS DO SISTEMA */}
            <Route element={<SidebarLayout />}>

              <Route path="/" element={<Dashboard />} />

              <Route path="/products" element={<Products />} />

              <Route path="/suppliers" element={<Suppliers />} />

              <Route path="/purchase-orders" element={<PurchaseOrders />} />

              <Route path="/stock-history" element={<StockHistory />} />

              <Route path="/activity-log" element={<ActivityLog />} />


              <Route path="/purchase-suggestions" element={<PurchaseSuggestions />} />

            </Route>

          </Routes>

        </BrowserRouter>

      </AppProvider>

    </ThemeProvider>

  );
}

export default App;