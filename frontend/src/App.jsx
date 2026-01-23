import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './lib/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Locations from './pages/admin/Locations';
import Users from './pages/admin/Users';
import Orders from './pages/admin/Orders';
import Reviews from './pages/admin/Reviews';
import LoyaltyCards from './pages/admin/LoyaltyCards';
import StaffLayout from './components/StaffLayout';
import StaffDashboard from './pages/staff/StaffDashboard';
import Reports from './pages/staff/Reports';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Admin routes */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="locations" element={<Locations />} />
                    <Route path="users" element={<Users />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="reviews" element={<Reviews />} />
                    <Route path="loyalty-cards" element={<LoyaltyCards />} />
                </Route>

                {/* Staff routes */}
                <Route path="/staff" element={<StaffLayout />}>
                    <Route index element={<StaffDashboard />} />
                    <Route path="reports" element={<Reports />} />
                </Route>

                {/* 404 Catch-all route */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;


