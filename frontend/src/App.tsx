import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageLoader from '@/components/PageLoader';
import useAuth from '@/store/useAuth';
import useTheme from '@/store/useTheme';
import ToastContainer from '@/components/Toast';
import { SyncProvider } from '@/providers/SyncProvider';
import RoleGate from '@/components/RoleGate';

const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Login = React.lazy(() => import('@/pages/Login'));
const Register = React.lazy(() => import('@/pages/Register'));
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

// SaaS Modullar
const SuperAdminDashboard = React.lazy(() => import('@/pages/saas/SuperAdminDashboard'));
const PendingBusinesses = React.lazy(() => import('@/pages/saas/PendingBusinesses'));
const AllBusinesses = React.lazy(() => import('@/pages/saas/AllBusinesses'));
const SuperAdminPayments = React.lazy(() => import('@/pages/saas/SuperAdminPayments'));
const SuperAdminSettings = React.lazy(() => import('@/pages/saas/SuperAdminSettings'));

const SA_PATH = '/gumsmass_645_super_admin_panel';

function App() {
  const user = useAuth(s => s.user);
  const initAuth = useAuth(s => s.initAuth);
  const initTheme = useTheme(s => s.initTheme);

  React.useEffect(() => {
    initAuth();
    initTheme();
  }, [initAuth, initTheme]);

  return (
    <ErrorBoundary>
      <SyncProvider>
        <BrowserRouter>
          <React.Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Foydalanuvchi tizimga kirmagan ── */}
              {!user ? (
                <>
                  <Route path="/register" element={<Register />} />
                  <Route path="*" element={<Login />} />
                </>
              ) : user.role === 'SUPERADMIN' ? (
                /* ── SuperAdmin — alohida layout, MainLayout YO'Q ── */
                <>
                  <Route path={SA_PATH} element={<SuperAdminLayout />}>
                    <Route index element={<SuperAdminDashboard />} />
                    <Route path="pending" element={<PendingBusinesses />} />
                    <Route path="all" element={<AllBusinesses />} />
                    <Route path="payments" element={<SuperAdminPayments />} />
                    <Route path="settings" element={<SuperAdminSettings />} />
                  </Route>
                  <Route path="*" element={<Navigate to={SA_PATH} replace />} />
                </>
              ) : (
                /* ── Oddiy foydalanuvchilar ── */
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="pos" element={<POS />} />
                  <Route path="products/list" element={<ProductList />} />
                  <Route path="products/sales" element={<SalesList />} />
                  <Route path="products/orders" element={<OrderList />} />
                  <Route path="products/dropped" element={<DroppedProducts />} />
                  <Route path="products/returned-customer" element={<ReturnedCustomer />} />
                  <Route path="products/returned-supplier" element={<ReturnedSupplier />} />
                  <Route path="products/categories" element={<CategoryList />} />
                  <Route path="products/attributes" element={<ProductAttributes />} />
                  <Route path="warehouse" element={<RoleGate allowedRoles={['ADMIN', 'MANAGER', 'STOREKEEPER']}><Warehouse /></RoleGate>} />
                  <Route path="production/list" element={<RoleGate allowedRoles={['ADMIN', 'MANAGER', 'STOREKEEPER']}><ProductionList /></RoleGate>} />
                  <Route path="production/raw-materials" element={<RoleGate allowedRoles={['ADMIN', 'MANAGER', 'STOREKEEPER']}><RawMaterials /></RoleGate>} />
                  <Route path="production/recipes" element={<RoleGate allowedRoles={['ADMIN', 'MANAGER', 'STOREKEEPER']}><Recipes /></RoleGate>} />
                  <Route path="production/dropped" element={<RoleGate allowedRoles={['ADMIN', 'MANAGER', 'STOREKEEPER']}><DroppedProduction /></RoleGate>} />
                  <Route path="suppliers/list" element={<SupplierList />} />
                  <Route path="suppliers/debts" element={<SupplierDebts />} />
                  <Route path="suppliers/contacts" element={<ContactList type="supplier" />} />
                  <Route path="customers/list" element={<CustomerList />} />
                  <Route path="customers/payments" element={<CustomerPayments />} />
                  <Route path="customers/contacts" element={<ContactList type="customer" />} />
                  <Route path="debts" element={<DebtList />} />
                  <Route path="staff" element={<RoleGate allowedRoles={['ADMIN']}><StaffList /></RoleGate>} />
                  <Route path="reports" element={<RoleGate allowedRoles={['ADMIN', 'MANAGER']}><Reports /></RoleGate>} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="audit" element={<RoleGate allowedRoles={['ADMIN']}><AuditLogs /></RoleGate>} />
                  <Route path="settings" element={<RoleGate allowedRoles={['ADMIN', 'MANAGER']}><Settings /></RoleGate>} />
                  <Route path="settings/warehouses" element={<RoleGate allowedRoles={['ADMIN', 'MANAGER']}><WarehouseManager /></RoleGate>} />
                  <Route path="*" element={<BlankPage />} />
                </Route>
              )}
            </Routes>
          </React.Suspense>
          <ToastContainer />
        </BrowserRouter>
      </SyncProvider>
    </ErrorBoundary>
  );
}

export default App;
