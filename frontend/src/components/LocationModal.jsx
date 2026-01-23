import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import './LocationModal.css';

const locationSchema = z.object({
    tipLocatie: z.enum(['Muzeu', 'Galerie']),
    numeLoc: z.string().min(2, 'Numele trebuie să aibă minim 2 caractere'),
    orasLoc: z.string().min(2, 'Orașul trebuie să aibă minim 2 caractere'),
    judet: z.string().optional(),
    adresa: z.string().min(5, 'Adresa trebuie să aibă minim 5 caractere'),
    orar: z.string().optional(),
    scurtaDescriere: z.string().optional(),
    siteOficial: z.string().url('URL invalid').optional().or(z.literal('')),
    locatieHarta: z.string().min(5, 'Locația pe hartă este obligatorie'),
    statusLocatie: z.enum(['Activ', 'Inactiv', 'Cerere']),
    imagineUrl: z.string().optional(),
});

export default function LocationModal({ location, onClose, onSave }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(locationSchema),
        defaultValues: location || {
            tipLocatie: 'Muzeu',
            statusLocatie: 'Cerere',
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
                    <h2>{location ? 'Editează Locația' : 'Adaugă Locație Nouă'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="location-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Tip Locație *</label>
                            <select {...register('tipLocatie')} className={errors.tipLocatie ? 'error' : ''}>
                                <option value="Muzeu">Muzeu</option>
                                <option value="Galerie">Galerie</option>
                            </select>
                            {errors.tipLocatie && <span className="field-error">{errors.tipLocatie.message}</span>}
                        </div>

                        <div className="form-group">
                            <label>Status *</label>
                            <select {...register('statusLocatie')} className={errors.statusLocatie ? 'error' : ''}>
                                <option value="Activ">Activ</option>
                                <option value="Inactiv">Inactiv</option>
                                <option value="Cerere">Cerere</option>
                            </select>
                            {errors.statusLocatie && <span className="field-error">{errors.statusLocatie.message}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Nume Locație *</label>
                        <input
                            type="text"
                            {...register('numeLoc')}
                            placeholder="Ex: Muzeul Național de Artă"
                            className={errors.numeLoc ? 'error' : ''}
                        />
                        {errors.numeLoc && <span className="field-error">{errors.numeLoc.message}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Oraș *</label>
                            <input
                                type="text"
                                {...register('orasLoc')}
                                placeholder="București"
                                className={errors.orasLoc ? 'error' : ''}
                            />
                            {errors.orasLoc && <span className="field-error">{errors.orasLoc.message}</span>}
                        </div>

                        <div className="form-group">
                            <label>Județ</label>
                            <input
                                type="text"
                                {...register('judet')}
                                placeholder="B"
                                className={errors.judet ? 'error' : ''}
                            />
                            {errors.judet && <span className="field-error">{errors.judet.message}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Adresă *</label>
                        <input
                            type="text"
                            {...register('adresa')}
                            placeholder="Calea Victoriei 49-53"
                            className={errors.adresa ? 'error' : ''}
                        />
                        {errors.adresa && <span className="field-error">{errors.adresa.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Orar</label>
                        <input
                            type="text"
                            {...register('orar')}
                            placeholder="Luni-Vineri: 10:00-18:00"
                            className={errors.orar ? 'error' : ''}
                        />
                        {errors.orar && <span className="field-error">{errors.orar.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Scurtă Descriere</label>
                        <textarea
                            {...register('scurtaDescriere')}
                            placeholder="Descriere scurtă a locației..."
                            rows="3"
                            className={errors.scurtaDescriere ? 'error' : ''}
                        />
                        {errors.scurtaDescriere && <span className="field-error">{errors.scurtaDescriere.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Site Oficial</label>
                        <input
                            type="url"
                            {...register('siteOficial')}
                            placeholder="https://www.example.com"
                            className={errors.siteOficial ? 'error' : ''}
                        />
                        {errors.siteOficial && <span className="field-error">{errors.siteOficial.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Locație Hartă (coordonate) *</label>
                        <input
                            type="text"
                            {...register('locatieHarta')}
                            placeholder="44.4396,26.0964"
                            className={errors.locatieHarta ? 'error' : ''}
                        />
                        {errors.locatieHarta && <span className="field-error">{errors.locatieHarta.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>URL Imagine</label>
                        <input
                            type="text"
                            {...register('imagineUrl')}
                            placeholder="https://example.com/image.jpg"
                            className={errors.imagineUrl ? 'error' : ''}
                        />
                        {errors.imagineUrl && <span className="field-error">{errors.imagineUrl.message}</span>}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Anulează
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Se salvează...' : location ? 'Actualizează' : 'Adaugă'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
