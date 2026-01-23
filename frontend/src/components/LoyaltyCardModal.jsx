import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import './LocationModal.css';

const loyaltyCardSchema = z.object({
    numeCard: z.string().min(2, 'Numele cardului trebuie să aibă minim 2 caractere'),
    puncteCard: z.coerce.number().int().min(0, 'Punctele trebuie să fie un număr pozitiv'),
    oferteSpeciale: z.string().optional(),
    oferteBunVenit: z.string().optional(),
});

export default function LoyaltyCardModal({ card, onClose, onSave }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loyaltyCardSchema),
        defaultValues: card || {
            puncteCard: 0,
        },
    });

    const onSubmit = async (data) => {
        setLoading(true);
        setError('');

        try {
            await onSave(data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'A apărut o eroare');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{card ? 'Editează Card' : 'Adaugă Card Nou'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="location-form">
                    <div className="form-group">
                        <label>Nume Card *</label>
                        <input
                            type="text"
                            {...register('numeCard')}
                            placeholder="Ex: Gold, Platinum"
                            className={errors.numeCard ? 'error' : ''}
                            disabled={!!card} // Nu permite modificarea numelui la edit
                        />
                        {errors.numeCard && <span className="field-error">{errors.numeCard.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Puncte Necesare *</label>
                        <input
                            type="number"
                            {...register('puncteCard')}
                            placeholder="0"
                            min="0"
                            className={errors.puncteCard ? 'error' : ''}
                        />
                        {errors.puncteCard && <span className="field-error">{errors.puncteCard.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Oferte Speciale</label>
                        <textarea
                            {...register('oferteSpeciale')}
                            placeholder="Descrie ofertele speciale pentru acest card..."
                            rows="3"
                            className={errors.oferteSpeciale ? 'error' : ''}
                        />
                        {errors.oferteSpeciale && <span className="field-error">{errors.oferteSpeciale.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Oferte Bun Venit</label>
                        <textarea
                            {...register('oferteBunVenit')}
                            placeholder="Descrie ofertele de bun venit pentru acest card..."
                            rows="3"
                            className={errors.oferteBunVenit ? 'error' : ''}
                        />
                        {errors.oferteBunVenit && <span className="field-error">{errors.oferteBunVenit.message}</span>}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Anulează
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Se salvează...' : card ? 'Actualizează' : 'Adaugă'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
