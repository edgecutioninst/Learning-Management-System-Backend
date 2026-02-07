import { body, param, query, validationResult } from "express-validator";

export const validate = (validation) => {
    return async (req, res, next) => {
        //run all validations
        await Promise.all(validation.flat().map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const extractedError = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }))

        throw new Error("Validation Failed", { cause: extractedError })

    }
}


export const commonValidation = {
    pagination: [
        query("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Page number must be a positive integer"),
        query("limit")
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage("Limit must be between 1 and 100"),
    ],
    email:
        body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    name:
        body("name").isString().trim().isLength({ min: 3, max: 50 }).withMessage("Please enter a valid name"),
}

export const validateSignUp = validate([
    commonValidation.email,
    commonValidation.name
])

export const validateGetAllCourses = validate([
    commonValidation.pagination
])


