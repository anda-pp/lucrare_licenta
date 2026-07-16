import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '../lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock } from 'lucide-react';
import './AuthPages.css';

// Validare cu Zod — includem și refine pentru verificarea că parolele coincid
const registerSchema = z.object({
    email: z.string().email('Email invalid'),
    password: z.string().min(6, 'Parola trebuie să aibă minim 6 caractere'),
    confirmPassword: z.string(),
    name: z.string().min(2, 'Numele trebuie să aibă minim 2 caractere'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Parolele nu coincid',
    path: ['confirmPassword'],
});

export default function Register() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data) => {
        setLoading(true);
        setError('');

        try {
            const result = await authClient.signUp.email({
                email: data.email,
                password: data.password,
                name: data.name,
            });

            if (result.error) {
                setError(result.error.message || 'Înregistrarea a eșuat');
            } else {
                // După înregistrare, BetterAuth creează sesiunea automat → Home redirecționează spre /user
                navigate('/');
            }
        } catch (err) {
            setError('A apărut o eroare. Te rugăm să încerci din nou.');
            console.error('Register error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Creează cont</h1>
                <p className="auth-subtitle">Înregistrează-te pentru a accesa platformă</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Nume complet</label>
                        <div className="input-wrapper">
                            <User className="input-icon" size={20} />
                            <input
                                id="name"
                                type="text"
                                {...register('name')}
                                placeholder="Ion Popescu"
                                className={errors.name ? 'error' : ''}
                            />
                        </div>
                        {errors.name && (
                            <span className="field-error">{errors.name.message}</span>
                        )}
                    </div>

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

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmă parola</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                id="confirmPassword"
                                type="password"
                                {...register('confirmPassword')}
                                placeholder="••••••••"
                                className={errors.confirmPassword ? 'error' : ''}
                            />
                        </div>
                        {errors.confirmPassword && (
                            <span className="field-error">{errors.confirmPassword.message}</span>
                        )}
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Se încarcă...' : 'Înregistrare'}
                    </button>
                </form>

                <p className="auth-footer">
                    Ai deja cont?{' '}
                    <Link to="/login" className="auth-link">
                        Conectează-te
                    </Link>
                </p>
            </div>
        </div>
    );
}
