import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './lib/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Events from './pages/users/Events';
import EventDetail from './pages/users/EventDetail';
import NoapteaMuzeelor from './pages/users/NoapteaMuzeelor';
import Artists from './pages/users/Artists';
import ArtistDetail from './pages/users/ArtistDetail';
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
import UserLayout from './components/UserLayout';
import UserDashboard from './pages/users/UserDashboard';
import LoyaltyCard from './pages/users/LoyaltyCard';
import UserLocations from './pages/users/Locations';
import LocationDetail from './pages/users/LocationDetail';
import MyFavorites from './pages/users/MyFavorites';
import MyOrders from './pages/users/MyOrders';
import MyReviews from './pages/users/MyReviews';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* User routes */}
                <Route path="/user" element={<UserLayout />}>
                    <Route index element={<UserDashboard />} />
                    <Route path="orders" element={<MyOrders />} />
                    <Route path="reviews" element={<MyReviews />} />
                    <Route path="loyalty" element={<LoyaltyCard />} />
                    <Route path="locations" element={<UserLocations />} />
                    <Route path="locations/:id" element={<LocationDetail />} />
                    <Route path="my-favorites" element={<MyFavorites />} />
                    {/* Public pages shown with sidebar */}
                    <Route path="events" element={<Events />} />
                    <Route path="events/:id" element={<EventDetail />} />
                    <Route path="noaptea-muzeelor" element={<NoapteaMuzeelor />} />
                    <Route path="artists" element={<Artists />} />
                    <Route path="artists/:id" element={<ArtistDetail />} />
                </Route>

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


