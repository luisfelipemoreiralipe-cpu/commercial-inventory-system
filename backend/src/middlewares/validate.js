/**
 * Factory that returns an Express middleware that validates
 * req.body against a Zod schema.
 *
 * On success  → req.body is replaced with the parsed (coerced) data.
 * On failure  → responds 422 with field-level errors.
 *
 * @param {import('zod').ZodSchema} schema
 */
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        return res.status(422).json({
            success: false,
            message: 'Dados inválidos.',
            errors: result.error.flatten().fieldErrors,
        });
    }

    req.body = result.data; // use parsed + coerced values downstream
    next();
};

module.exports = validate;
