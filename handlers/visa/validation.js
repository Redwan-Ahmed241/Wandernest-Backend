const { z } = require('zod');

// Country and Visa Category Schemas
const CountrySchema = z.object({
    code: z.string().length(2).toUpperCase(),
    name: z.string().min(1),
    visa_policy_url: z.string().url().optional(),
    notes: z.string().optional()
});

const FeeSchema = z.object({
    type: z.enum(['government', 'service', 'convenience']),
    amount: z.number().positive(),
    currency: z.string().length(3),
    refundable: z.boolean()
});

const ProcessingTimeSchema = z.object({
    type: z.enum(['standard', 'express', 'urgent']),
    minDays: z.number().int().positive(),
    maxDays: z.number().int().positive(),
    notes: z.string().optional()
});

const RequirementSchema = z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    description: z.string().optional(),
    required: z.boolean(),
    documentType: z.enum(['pdf', 'image', 'doc', 'other']),
    mimeTypes: z.array(z.string()).optional(),
    maxSizeMB: z.number().positive().optional()
});

const VisaCategorySchema = z.object({
    id: z.string().min(1),
    countryCode: z.string().length(2).toUpperCase(),
    slug: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    validityDays: z.number().int().positive(),
    maxStayDays: z.number().int().positive(),
    multipleEntry: z.boolean(),
    fees: z.array(FeeSchema),
    processingTimes: z.array(ProcessingTimeSchema),
    requirements: z.array(RequirementSchema)
});

// Application Schemas
const ApplicantSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    nationality: z.string().length(2).toUpperCase(),
    passportNumber: z.string().min(1),
    passportExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    email: z.string().email(),
    phone: z.string().optional()
});

const TravelSchema = z.object({
    entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    exitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    purpose: z.string().min(1)
});

const CreateApplicationSchema = z.object({
    countryCode: z.string().length(2).toUpperCase(),
    categorySlug: z.string().min(1),
    applicant: ApplicantSchema,
    travel: TravelSchema
});

const UpdateApplicationSchema = z.object({
    applicant: ApplicantSchema.optional(),
    travel: TravelSchema.optional()
}).refine(data => data.applicant || data.travel, {
    message: "At least one field (applicant or travel) must be provided"
});

// Document Schemas
const UploadDocumentSchema = z.object({
    requirementKey: z.string().min(1)
    // file is handled by multer middleware
});

// Appointment Schemas
const CreateAppointmentSchema = z.object({
    centerCode: z.string().min(1),
    dateTime: z.string().datetime(), // ISO 8601
    timezone: z.string().min(1)
});

const UpdateAppointmentSchema = z.object({
    dateTime: z.string().datetime().optional(),
    timezone: z.string().optional(),
    status: z.enum(['scheduled', 'rescheduled', 'canceled', 'attended']).optional()
}).refine(data => data.dateTime || data.timezone || data.status, {
    message: "At least one field must be provided for update"
});

// Payment Schemas
const CreatePaymentSchema = z.object({
    provider: z.enum(['stripe', 'bkash', 'sslcommerz', 'mock'])
});

// Query Parameter Schemas
const PaginationSchema = z.object({
    page: z.string().transform(val => parseInt(val)).refine(val => val > 0, "Page must be positive").optional(),
    limit: z.string().transform(val => Math.min(parseInt(val), 100)).refine(val => val > 0, "Limit must be positive").optional()
});

const ApplicationFiltersSchema = z.object({
    status: z.enum(['draft', 'submitted', 'under_review', 'additional_info_required', 'approved', 'rejected', 'withdrawn']).optional(),
    countryCode: z.string().length(2).toUpperCase().optional(),
    categorySlug: z.string().optional(),
    dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const CountriesQuerySchema = PaginationSchema.extend({
    q: z.string().optional()
});

// Validation middleware factory
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request body',
                    details: error.errors
                }
            });
        }
    };
};

const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid query parameters',
                    details: error.errors
                }
            });
        }
    };
};

const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            req.params = schema.parse(req.params);
            next();
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid URL parameters',
                    details: error.errors
                }
            });
        }
    };
};

module.exports = {
    // Schemas
    CountrySchema,
    FeeSchema,
    ProcessingTimeSchema,
    RequirementSchema,
    VisaCategorySchema,
    ApplicantSchema,
    TravelSchema,
    CreateApplicationSchema,
    UpdateApplicationSchema,
    UploadDocumentSchema,
    CreateAppointmentSchema,
    UpdateAppointmentSchema,
    CreatePaymentSchema,
    PaginationSchema,
    ApplicationFiltersSchema,
    CountriesQuerySchema,

    // Middleware
    validateBody,
    validateQuery,
    validateParams
};