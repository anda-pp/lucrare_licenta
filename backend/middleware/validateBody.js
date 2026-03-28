/**
 * Zod request body validation middleware.
 * Usage: router.post('/route', validateBody(mySchema), handler)
 */
export function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.errors.map(e => e.message).join('; ');
            return res.status(400).json({ success: false, error: errors });
        }
        req.body = result.data; // replace with coerced/validated data
        next();
    };
}
