import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import MainLayout from "./components/MainLayout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import RegisterSalePage from "./pages/RegisterSalePage.jsx";
import MedicationsPage from "./pages/MedicationsPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import NewInventoryCheckPage from "./pages/NewInventoryCheckPage.jsx"
import UsersPage from "./pages/admin/UsersPage.jsx";
import ReceiveOrderPage from "./pages/ReceiveOrderPage.jsx";
import SalesHistoryPage from "./pages/SalesHistoryPage.jsx";
import InventoryCheckListPage from './pages/InventoryCheckListPage.jsx';
import InventoryCheckDetailPage from './pages/InventoryCheckDetailPage.jsx';
import NotFound from "./pages/NotFound";
import SaleReceiptPage from './pages/SaleReceiptPage';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/" element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }>
              <Route path="inventory/new-check" element={<NewInventoryCheckPage />} />
              <Route path="inventory/receive-order" element={<ReceiveOrderPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="register-sale" element={<RegisterSalePage />} />
              <Route path="medications" element={<MedicationsPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="admin/users" element={<UsersPage />} />
              <Route path="sales" element={<SalesHistoryPage />} />
              <Route path="inventory/checks" element={<InventoryCheckListPage />} />
              <Route path="inventory/checks/:id" element={<InventoryCheckDetailPage />} />
              <Route path="sales/:id" element={<SaleReceiptPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;