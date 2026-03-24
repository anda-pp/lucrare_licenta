import { auth } from '../lib/auth.js';

/**
 * Middleware to require authentication
 * Verifies that the user is logged in
 */
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

        // Attach user and session to request
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

/**
 * Middleware to require specific roles
 * @param {string[]} roles - Array of allowed roles
 */
export const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            // First check if user is authenticated
            const session = await auth.api.getSession({
                headers: req.headers,
            });

            if (!session) {
                return res.status(401).json({
                    error: 'Neautorizat',
                    message: 'Trebuie să fii autentificat',
                });
            }

            // Check if user has required role
            const userRole = session.user.role;

            if (!roles.includes(userRole)) {
                return res.status(403).json({
                    error: 'Acces interzis',
                    message: `Această resursă necesită unul din următoarele roluri: ${roles.join(', ')}`,
                });
            }

            // Attach user and session to request
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

/**
 * Middleware to check if user is superadmin
 */
export const requireSuperadmin = requireRole(['Superadmin']);

/**
 * Middleware to check if user is admin or superadmin
 */
export const requireAdmin = requireRole(['Admin', 'Superadmin']);

/**
 * Middleware to check if user is staff, admin, or superadmin
 */
export const requireStaff = requireRole(['Personal', 'Admin', 'Superadmin']);

/**
 * Middleware to check if user owns the resource or is admin
 * Expects req.params.userId or req.body.userId
 */
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

/**
 * Optional auth middleware - attaches user if authenticated but doesn't require it
 */
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
        // Silently fail - user is not authenticated
        next();
    }
};
