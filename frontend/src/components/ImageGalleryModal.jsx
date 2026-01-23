import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Camera, X, Loader, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import './ImageGalleryModal.css';

export default function ImageGalleryModal({ location, onClose }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:5000/api/uploads/location/${location.codUnicLocatie}`,
                { withCredentials: true }
            );
            setImages(response.data.images || []);
        } catch (err) {
            console.error('Fetch images error:', err);
            setError('Nu s-au putut încărca imaginile');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        for (const file of files) {
            formData.append('images', file);
        }

        try {
            setUploading(true);
            setError('');
            await axios.post(
                `http://localhost:5000/api/uploads/location/${location.codUnicLocatie}`,
                formData,
                {
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );
            fetchImages();
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || 'Eroare la încărcarea imaginilor');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async (imageId) => {
        if (!confirm('Sigur vrei să ștergi această imagine?')) return;

        try {
            await axios.delete(
                `http://localhost:5000/api/uploads/image/${imageId}`,
                { withCredentials: true }
            );
            fetchImages();
        } catch (err) {
            console.error('Delete error:', err);
            setError('Eroare la ștergerea imaginii');
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content gallery-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Camera size={24} className="text-primary" />
                        <h2>Galerie Imagini</h2>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <p className="modal-subtitle" style={{ padding: '0 2rem', marginTop: '-1rem', marginBottom: '1rem' }}>
                    {location.numeLoc}
                </p>

                <div className="modal-body">
                    {error && <div className="error-message">{error}</div>}

                    {/* Upload Section */}
                    <div className="upload-section">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            multiple
                            onChange={handleUpload}
                            style={{ display: 'none' }}
                            id="image-upload"
                        />
                        <label htmlFor="image-upload" className={`upload-btn ${uploading ? 'disabled' : ''}`}>
                            {uploading ? (
                                <>
                                    <Loader size={18} className="spin" /> Se încarcă...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} /> Încarcă Imagini
                                </>
                            )}
                        </label>
                        <span className="upload-hint">
                            JPEG, PNG, GIF, WebP • Max 5MB • Max 10 fișiere
                        </span>
                    </div>

                    {/* Images Grid */}
                    {loading ? (
                        <div className="loading">Se încarcă imaginile...</div>
                    ) : images.length === 0 ? (
                        <div className="empty-gallery">
                            <div className="empty-icon">
                                <ImageIcon size={48} strokeWidth={1} />
                            </div>
                            <p>Nu există imagini încărcate pentru această locație</p>
                            <p className="empty-hint">Apasă pe "Încarcă Imagini" pentru a adăuga</p>
                        </div>
                    ) : (
                        <div className="images-grid">
                            {images.map((image) => (
                                <div key={image.codUnicImagine} className="image-card">
                                    <img
                                        src={`http://localhost:5000${image.caleFisier}`}
                                        alt={image.numeOriginal}
                                        className="image-preview"
                                    />
                                    <div className="image-info">
                                        <span className="image-name" title={image.numeOriginal}>
                                            {image.numeOriginal}
                                        </span>
                                        <span className="image-size">
                                            {formatFileSize(image.marimeFisier)}
                                        </span>
                                    </div>
                                    <button
                                        className="delete-image-btn"
                                        onClick={() => handleDelete(image.codUnicImagine)}
                                        title="Șterge imaginea"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <span className="images-count">{images.length} imagine(i)</span>
                    <button className="btn-secondary" onClick={onClose}>
                        Închide
                    </button>
                </div>
            </div>
        </div>
    );
}
