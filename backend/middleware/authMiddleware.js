import { auth } from '../lib/auth.js';

// Verifică dacă userul are o sesiune activă; dacă nu, returnează 401
export const requireAuth = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session) {
            return res.status(401).json({
                error: 'Neautorizat',
                message: 'Trebuie să fii autentificat pentru a accesa această resursă',
            });
        }

        // Atașăm userul și sesiunea pe req ca să fie disponibile în controllere
        req.user = session.user;
        req.session = session.session;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            error: 'Neautorizat',
            message: 'Sesiune invalidă',
        });
    }
};

// Factory care generează un middleware de verificare rol
// Se folosește astfel: requireRole(['Admin', 'Superadmin'])
export const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            const session = await auth.api.getSession({
                headers: req.headers,
            });

            if (!session) {
                return res.status(401).json({
                    error: 'Neautorizat',
                    message: 'Trebuie să fii autentificat',
                });
            }

            const userRole = session.user.role;

            if (!roles.includes(userRole)) {
                return res.status(403).json({
                    error: 'Acces interzis',
                    message: `Această resursă necesită unul din următoarele roluri: ${roles.join(', ')}`,
                });
            }

            req.user = session.user;
            req.session = session.session;

            next();
        } catch (error) {
            console.error('Role middleware error:', error);
            return res.status(401).json({
                error: 'Neautorizat',
                message: 'Sesiune invalidă',
            });
        }
    };
};

// Scurtături pentru rolurile folosite frecvent în rute
export const requireSuperadmin = requireRole(['Superadmin']);
export const requireAdmin = requireRole(['Admin', 'Superadmin']);
export const requireStaff = requireRole(['Personal', 'Admin', 'Superadmin']);

// Permite accesul doar dacă userul este proprietarul resursei sau admin
// Caută userId în params.userId, body.userId sau params.id
export const requireOwnerOrAdmin = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session) {
            return res.status(401).json({
                error: 'Neautorizat',
                message: 'Trebuie să fii autentificat',
            });
        }

        const userId = req.params.userId || req.body.userId || req.params.id;
        const isOwner = session.user.id === userId;
        const isAdmin = session.user.role === 'Admin' || session.user.role === 'Superadmin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                error: 'Acces interzis',
                message: 'Nu ai permisiunea să accesezi această resursă',
            });
        }

        req.user = session.user;
        req.session = session.session;

        next();
    } catch (error) {
        console.error('Owner/Admin middleware error:', error);
        return res.status(401).json({
            error: 'Neautorizat',
            message: 'Sesiune invalidă',
        });
    }
};

// Middleware opțional — nu blochează accesul, dar atașează userul pe req dacă este autentificat
// Util pe rute publice unde comportamentul diferă în funcție de autentificare
export const optionalAuth = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (session) {
            req.user = session.user;
            req.session = session.session;
        }

        next();
    } catch (error) {
        // Dacă sesiunea nu poate fi verificată, continuăm fără user pe req
        next();
    }
};
