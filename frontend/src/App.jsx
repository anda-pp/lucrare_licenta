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
import AdminEvents from './pages/admin/Events';
import AdminReservations from './pages/admin/Reservations';
import AdminArtists from './pages/admin/Artists';
import RewardsAdmin from './pages/admin/RewardsAdmin';
import BadgesAdmin from './pages/admin/BadgesAdmin';
import TrailsAdmin from './pages/admin/TrailsAdmin';
import VouchersAdmin from './pages/admin/VouchersAdmin';
import StaffAccountsAdmin from './pages/admin/StaffAccountsAdmin';

import MuseumAdminLayout from './components/MuseumAdminLayout';
import MuseumDashboard from './pages/museum-admin/Dashboard';
import MyMuseum from './pages/museum-admin/MyMuseum';
import MuseumEvents from './pages/museum-admin/Events';
import MuseumReservations from './pages/museum-admin/Reservations';
import MuseumOrders from './pages/museum-admin/Orders';
import MuseumReviews from './pages/museum-admin/Reviews';

import StaffLayout from './components/StaffLayout';
import StaffDashboard from './pages/staff/StaffDashboard';
import Reports from './pages/staff/Reports';
import UserLayout from './components/UserLayout';
import UserDashboard from './pages/users/UserDashboard';
import LoyaltyCard from './pages/users/LoyaltyCard';
import UserLocations from './pages/users/Locations';
import LocationDetail from './pages/users/LocationDetail';
import MyFavorites from './pages/users/MyFavorites';
import MyInterests from './pages/users/MyInterests';
import MyOrders from './pages/users/MyOrders';
import MyReservations from './pages/users/MyReservations';
import MyReviews from './pages/users/MyReviews';
import Checkout from './pages/users/Checkout';
import EventReservation from './pages/users/EventReservation';
import Badges from './pages/users/Badges';
import Rewards from './pages/users/Rewards';
import CulturalTrails from './pages/users/CulturalTrails';
import PaymentSuccess from './pages/users/PaymentSuccess';
import PaymentCancel from './pages/users/PaymentCancel';
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
                    <Route path="reservations" element={<MyReservations />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="reviews" element={<MyReviews />} />
                    <Route path="loyalty" element={<LoyaltyCard />} />
                    <Route path="locations" element={<UserLocations />} />
                    <Route path="locations/:id" element={<LocationDetail />} />
                    <Route path="my-favorites" element={<MyFavorites />} />
                    <Route path="interests" element={<MyInterests />} />
                    {/* Public pages shown with sidebar */}
                    <Route path="events" element={<Events />} />
                    <Route path="events/:id" element={<EventDetail />} />
                    <Route path="reserve/:eventId" element={<EventReservation />} />
                    <Route path="noaptea-muzeelor" element={<NoapteaMuzeelor />} />
                    <Route path="artists" element={<Artists />} />
                    <Route path="artists/:id" element={<ArtistDetail />} />
                    <Route path="badges" element={<Badges />} />
                    <Route path="rewards" element={<Rewards />} />
                    <Route path="trails" element={<CulturalTrails />} />
                    <Route path="payment/success" element={<PaymentSuccess />} />
                    <Route path="payment/cancel" element={<PaymentCancel />} />
                </Route>

                {/* Superadmin routes */}
                <Route path="/superadmin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="locations" element={<Locations />} />
                    <Route path="users" element={<Users />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="reviews" element={<Reviews />} />
                    <Route path="loyalty-cards" element={<LoyaltyCards />} />
                    <Route path="events" element={<AdminEvents />} />
                    <Route path="reservations" element={<AdminReservations />} />
                    <Route path="artists" element={<AdminArtists />} />
                    <Route path="rewards" element={<RewardsAdmin />} />
                    <Route path="badges" element={<BadgesAdmin />} />
                    <Route path="trails" element={<TrailsAdmin />} />
                    <Route path="vouchers" element={<VouchersAdmin />} />
                    <Route path="staff-accounts" element={<StaffAccountsAdmin />} />
                </Route>

                {/* Museum Admin routes (Manager Local) */}
                <Route path="/admin" element={<MuseumAdminLayout />}>
                    <Route index element={<MuseumDashboard />} />
                    <Route path="my-museum" element={<MyMuseum />} />
                    <Route path="events" element={<MuseumEvents />} />
                    <Route path="reservations" element={<MuseumReservations />} />
                    <Route path="orders" element={<MuseumOrders />} />
                    <Route path="reviews" element={<MuseumReviews />} />
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


