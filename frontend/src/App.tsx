import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageLoader from '@/components/PageLoader';
import useAuth from '@/store/useAuth';
import useTheme from '@/store/useTheme';
import ToastContainer from '@/components/Toast';

const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Login = React.lazy(() => import('@/pages/Login'));
const ProductList = React.lazy(() => import('@/pages/products/ProductList'));
const SalesList = React.lazy(() => import('@/pages/products/SalesList'));
const Warehouse = React.lazy(() => import('@/pages/warehouse/Warehouse'));
const ProductionList = React.lazy(() => import('@/pages/production/ProductionList'));
const RawMaterials = React.lazy(() => import('@/pages/production/RawMaterials'));
const Recipes = React.lazy(() => import('@/pages/production/Recipes'));
const CustomerList = React.lazy(() => import('@/pages/customers/CustomerList'));
const CustomerPayments = React.lazy(() => import('@/pages/customers/CustomerPayments'));
const SupplierList = React.lazy(() => import('@/pages/suppliers/SupplierList'));
const SupplierDebts = React.lazy(() => import('@/pages/suppliers/SupplierDebts'));
const BlankPage = React.lazy(() => import('@/pages/BlankPage'));
const Expenses = React.lazy(() => import('@/pages/expenses/Expenses'));
const AuditLogs = React.lazy(() => import('@/pages/audit/AuditLogs'));

// Yangi modullar
const POS = React.lazy(() => import('@/pages/pos/POS'));
const DebtList = React.lazy(() => import('@/pages/debts/DebtList'));
const Reports = React.lazy(() => import('@/pages/reports/Reports'));
const StaffList = React.lazy(() => import('@/pages/staff/StaffList'));
const OrderList = React.lazy(() => import('@/pages/orders/OrderList'));
const Settings = React.lazy(() => import('@/pages/settings/Settings'));
const WarehouseManager = React.lazy(() => import('@/pages/settings/WarehouseManager'));
const CategoryList = React.lazy(() => import('@/pages/products/CategoryList'));
const DroppedProducts = React.lazy(() => import('@/pages/products/DroppedProducts'));
const ReturnedCustomer = React.lazy(() => import('@/pages/products/ReturnedCustomer'));
const ReturnedSupplier = React.lazy(() => import('@/pages/products/ReturnedSupplier'));
const ProductAttributes = React.lazy(() => import('@/pages/products/ProductAttributes'));
const DroppedProduction = React.lazy(() => import('@/pages/production/DroppedProduction'));
const ContactList = React.lazy(() => import('@/pages/contacts/ContactList'));

function App() {
  const user = useAuth(s => s.user);
  const initAuth = useAuth(s => s.initAuth);
  const initTheme = useTheme((s: any) => s.initTheme);

  React.useEffect(() => {
    initAuth();
    initTheme();
  }, [initAuth, initTheme]);

  if (!user) {
    return (
      <>
        <Login />
        <ToastContainer />
      </>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <React.Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />

            {/* POS - Kassir */}
            <Route path="pos" element={<POS />} />

            {/* Mahsulotlar */}
            <Route path="products/list" element={<ProductList />} />
            <Route path="products/sales" element={<SalesList />} />
            <Route path="products/orders" element={<OrderList />} />
            <Route path="products/dropped" element={<DroppedProducts />} />
            <Route path="products/returned-customer" element={<ReturnedCustomer />} />
            <Route path="products/returned-supplier" element={<ReturnedSupplier />} />
            <Route path="products/categories" element={<CategoryList />} />
            <Route path="products/attributes" element={<ProductAttributes />} />

            {/* Ombor */}
            <Route path="warehouse" element={<Warehouse />} />

            {/* Ishlab chiqarish */}
            <Route path="production/list" element={<ProductionList />} />
            <Route path="production/raw-materials" element={<RawMaterials />} />
            <Route path="production/recipes" element={<Recipes />} />
            <Route path="production/dropped" element={<DroppedProduction />} />

            {/* Yetkazuvchilar */}
            <Route path="suppliers/list" element={<SupplierList />} />
            <Route path="suppliers/debts" element={<SupplierDebts />} />
            <Route path="suppliers/contacts" element={<ContactList type="supplier" />} />

            {/* Mijozlar */}
            <Route path="customers/list" element={<CustomerList />} />
            <Route path="customers/payments" element={<CustomerPayments />} />
            <Route path="customers/contacts" element={<ContactList type="customer" />} />

            {/* Qarzlar */}
            <Route path="debts" element={<DebtList />} />

            {/* Xodimlar */}
            <Route path="staff" element={<StaffList />} />

            {/* Hisobotlar */}
            <Route path="reports" element={<Reports />} />

            {/* Xarajatlar va Audit */}
            <Route path="expenses" element={<Expenses />} />
            <Route path="audit" element={<AuditLogs />} />

            {/* Sozlamalar */}
            <Route path="settings" element={<Settings />} />
            <Route path="settings/warehouses" element={<WarehouseManager />} />

            <Route path="*" element={<BlankPage />} />
          </Route>
          </Routes>
        </React.Suspense>
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
