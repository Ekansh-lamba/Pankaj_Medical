const { z } = require('zod');

// Signup schema
const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number' })
    .optional()
});

// Login schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
  rememberMe: z.boolean().optional()
});

// Google token auth schema
const googleSchema = z.object({
  idToken: z.string().min(1, { message: 'Firebase ID Token is required' })
});

// Phone verification schema
const phoneVerifySchema = z.object({
  idToken: z.string().min(1, { message: 'Firebase ID Token is required' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }).optional()
});

// Forgot password schema
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' })
});

// Reset password schema
const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' })
});

// Middleware factory function
const validateRequest = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: fieldErrors
      });
    }
    next(error);
  }
};

module.exports = {
  validateSignup: validateRequest(signupSchema),
  validateLogin: validateRequest(loginSchema),
  validateGoogleAuth: validateRequest(googleSchema),
  validatePhoneAuth: validateRequest(phoneVerifySchema),
  validateForgotPassword: validateRequest(forgotPasswordSchema),
  validateResetPassword: validateRequest(resetPasswordSchema)
};
