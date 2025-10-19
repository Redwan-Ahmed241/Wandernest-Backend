const express = require('express');
const { randomUUID } = require('crypto');
const applicationsRouter = express.Router();
const supabase = require('../../utils/supabaseClient');
const { authenticateToken, requireOwnership } = require('../../middleware/auth');
const {
    validateBody,
    validateQuery,
    CreateApplicationSchema,
    UpdateApplicationSchema,
    PaginationSchema,
    ApplicationFiltersSchema
} = require('./validation');

// POST /applications - Create new application
applicationsRouter.post('/', authenticateToken, validateBody(CreateApplicationSchema), async (req, res) => {
    try {
        const { countryCode, categorySlug, applicant, travel } = req.body;

        // Verify country and category exist
        const { data: category, error: categoryError } = await supabase
            .from('visa_categories')
            .select('id')
            .eq('country_code', countryCode.toUpperCase())
            .eq('slug', categorySlug)
            .single();

        if (categoryError || !category) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid country code or category slug'
                }
            });
        }

        const applicationId = randomUUID();
        const application = {
            id: applicationId,
            user_id: req.user.id,
            country_code: countryCode.toUpperCase(),
            category_slug: categorySlug,
            applicant,
            travel,
            status: 'draft',
            payment_status: 'unpaid'
        };

        const { data, error } = await supabase
            .from('applications')
            .insert(application)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to create application',
                details: error.message
            }
        });
    }
});

// GET /applications - List user's applications
applicationsRouter.get('/', authenticateToken, validateQuery(PaginationSchema.merge(ApplicationFiltersSchema)), async (req, res) => {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 20;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('applications')
            .select('*', { count: 'exact' })
            .eq('user_id', req.user.id)
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        // Apply filters
        if (req.query.status) {
            query = query.eq('status', req.query.status);
        }
        if (req.query.countryCode) {
            query = query.eq('country_code', req.query.countryCode);
        }
        if (req.query.categorySlug) {
            query = query.eq('category_slug', req.query.categorySlug);
        }
        if (req.query.dateFrom) {
            query = query.gte('created_at', req.query.dateFrom);
        }
        if (req.query.dateTo) {
            query = query.lte('created_at', req.query.dateTo);
        }

        const { data: applications, error, count } = await query;

        if (error) throw error;

        const totalPages = Math.ceil(count / limit);

        res.json({
            success: true,
            data: applications,
            meta: {
                page,
                limit,
                total: count,
                totalPages
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to fetch applications',
                details: error.message
            }
        });
    }
});

// GET /applications/:id - Get single application
applicationsRouter.get('/:id', authenticateToken, requireOwnership('application'), async (req, res) => {
    try {
        const { id } = req.params;

        const { data: application, error } = await supabase
            .from('applications')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Application not found'
                    }
                });
            }
            throw error;
        }

        res.json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to fetch application',
                details: error.message
            }
        });
    }
});

// PATCH /applications/:id - Update application
applicationsRouter.patch('/:id', authenticateToken, requireOwnership('application'), validateBody(UpdateApplicationSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data: application, error } = await supabase
            .from('applications')
            .update(updates)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .eq('status', 'draft')
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Application not found or not in draft status'
                    }
                });
            }
            throw error;
        }

        res.json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to update application',
                details: error.message
            }
        });
    }
});

// POST /applications/:id/submit - Submit application
applicationsRouter.post('/:id/submit', authenticateToken, requireOwnership('application'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if application can be submitted (has required documents, etc.)
        // This is a simplified check - in production you'd validate all requirements

        const { data: application, error } = await supabase
            .from('applications')
            .update({ status: 'submitted' })
            .eq('id', id)
            .eq('user_id', req.user.id)
            .eq('status', 'draft')
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'CONFLICT',
                        message: 'Application not found or cannot be submitted'
                    }
                });
            }
            throw error;
        }

        // Create status event
        await supabase
            .from('status_events')
            .insert({
                id: randomUUID(),
                application_id: id,
                status: 'submitted',
                message: 'Application submitted for review'
            });

        res.json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to submit application',
                details: error.message
            }
        });
    }
});

// POST /applications/:id/withdraw - Withdraw application
applicationsRouter.post('/:id/withdraw', authenticateToken, requireOwnership('application'), async (req, res) => {
    try {
        const { id } = req.params;

        const { data: application, error } = await supabase
            .from('applications')
            .update({ status: 'withdrawn' })
            .eq('id', id)
            .eq('user_id', req.user.id)
            .neq('status', 'withdrawn')
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'CONFLICT',
                        message: 'Application not found or cannot be withdrawn'
                    }
                });
            }
            throw error;
        }

        // Create status event
        await supabase
            .from('status_events')
            .insert({
                id: randomUUID(),
                application_id: id,
                status: 'withdrawn',
                message: 'Application withdrawn by user'
            });

        res.json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to withdraw application',
                details: error.message
            }
        });
    }
});

// GET /applications/:id/status-events - Get status events for application
applicationsRouter.get('/:id/status-events', authenticateToken, requireOwnership('application'), async (req, res) => {
    try {
        const { id } = req.params;

        const { data: events, error } = await supabase
            .from('status_events')
            .select('*')
            .eq('application_id', id)
            .order('occurred_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to fetch status events',
                details: error.message
            }
        });
    }
});

module.exports = applicationsRouter;