import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '../lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import './AuthPages.css';

// Schema de validare cu Zod — erori inline afișate direct sub câmp
const loginSchema = z.object({
    email: z.string().email('Email invalid'),
    password: z.string().min(6, 'Parola trebuie să aibă minim 6 caractere'),
});

export default function Login() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data) => {
        setLoading(true);
        setError('');

        try {
            const result = await authClient.signIn.email({
                email: data.email,
                password: data.password,
            });

            if (result.error) {
                setError(result.error.message || 'Email sau parolă incorectă');
            } else {
                // Obținem sesiunea după autentificare pentru a citi rolul și a redirecționa corect
                const session = await authClient.getSession();
                const userRole = session?.data?.user?.role;

                if (userRole === 'Superadmin') {
                    navigate('/superadmin');
                } else if (userRole === 'Admin') {
                    navigate('/admin'); 
                } else if (userRole === 'Personal') {
                    navigate('/staff');
                } else {
                    navigate('/user');
                }
            }
        } catch (err) {
            setError('A apărut o eroare. Te rugăm să încerci din nou.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Bine ai venit!</h1>
                <p className="auth-subtitle">Conectează-te la contul tău</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={20} />
                            <input
                                id="email"
                                type="email"
                                {...register('email')}
                                placeholder="exemplu@email.com"
                                className={errors.email ? 'error' : ''}
                            />
                        </div>
                        {errors.email && (
                            <span className="field-error">{errors.email.message}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Parolă</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                id="password"
                                type="password"
                                {...register('password')}
                                placeholder="••••••••"
                                className={errors.password ? 'error' : ''}
                            />
                        </div>
                        {errors.password && (
                            <span className="field-error">{errors.password.message}</span>
                        )}
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Se încarcă...' : 'Conectare'}
                    </button>
                </form>

                <p className="auth-footer">
                    Nu ai cont?{' '}
                    <Link to="/register" className="auth-link">
                        Înregistrează-te
                    </Link>
                </p>
            </div>
        </div>
    );
}
