import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <AppProvider>
        <BrowserRouter>
          <SidebarLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/stock-history" element={<StockHistory />} />
              <Route path="/activity-log" element={<ActivityLog />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </SidebarLayout>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
