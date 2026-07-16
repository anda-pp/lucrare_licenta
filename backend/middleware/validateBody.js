// Middleware de validare body cu Zod — folosit ca: router.post('/ruta', validateBody(schema), handler)
// Dacă validarea eșuează, returnează 400 cu lista de erori; altfel înlocuiește req.body cu datele validate/coercite
export function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.errors.map(e => e.message).join('; ');
            return res.status(400).json({ success: false, error: errors });
        }
        req.body = result.data;
        next();
    };
}
