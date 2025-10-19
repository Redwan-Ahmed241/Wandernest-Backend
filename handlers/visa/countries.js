const express = require('express');
const countriesRouter = express.Router();
const supabase = require('../../utils/supabaseClient');
const { validateQuery, CountriesQuerySchema } = require('./validation');

// GET /countries - List countries with pagination
countriesRouter.get('/', validateQuery(CountriesQuerySchema), async (req, res) => {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 20;
        const offset = (page - 1) * limit;
        const searchQuery = req.query.q || '';

        let query = supabase
            .from('countries')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('name');

        if (searchQuery) {
            query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data: countries, error, count } = await query;

        if (error) throw error;

        const totalPages = Math.ceil(count / limit);

        res.json({
            success: true,
            data: countries,
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
                message: 'Failed to fetch countries',
                details: error.message
            }
        });
    }
});

// GET /countries/:code - Get single country
countriesRouter.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;

        const { data: country, error } = await supabase
            .from('countries')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Country not found'
                    }
                });
            }
            throw error;
        }

        res.json({
            success: true,
            data: country
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to fetch country',
                details: error.message
            }
        });
    }
});

// GET /countries/:code/visa-categories - Get visa categories for a country
countriesRouter.get('/:code/visa-categories', async (req, res) => {
    try {
        const { code } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;

        const { data: categories, error, count } = await supabase
            .from('visa_categories')
            .select('*', { count: 'exact' })
            .eq('country_code', code.toUpperCase())
            .range(offset, offset + limit - 1)
            .order('name');

        if (error) throw error;

        const totalPages = Math.ceil(count / limit);

        res.json({
            success: true,
            data: categories,
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
                message: 'Failed to fetch visa categories',
                details: error.message
            }
        });
    }
});

// GET /countries/:code/visa-categories/:slug - Get specific visa category
countriesRouter.get('/:code/visa-categories/:slug', async (req, res) => {
    try {
        const { code, slug } = req.params;

        const { data: category, error } = await supabase
            .from('visa_categories')
            .select('*')
            .eq('country_code', code.toUpperCase())
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Visa category not found'
                    }
                });
            }
            throw error;
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to fetch visa category',
                details: error.message
            }
        });
    }
});

// GET /countries/:code/visa-categories/:slug/requirements - Get requirements for visa category
countriesRouter.get('/:code/visa-categories/:slug/requirements', async (req, res) => {
    try {
        const { code, slug } = req.params;

        const { data: category, error } = await supabase
            .from('visa_categories')
            .select('requirements')
            .eq('country_code', code.toUpperCase())
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Visa category not found'
                    }
                });
            }
            throw error;
        }

        res.json({
            success: true,
            data: category.requirements || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to fetch requirements',
                details: error.message
            }
        });
    }
});

// GET /countries/:code/visa-categories/:slug/fees - Get fees for visa category
countriesRouter.get('/:code/visa-categories/:slug/fees', async (req, res) => {
    try {
        const { code, slug } = req.params;

        const { data: category, error } = await supabase
            .from('visa_categories')
            .select('fees')
            .eq('country_code', code.toUpperCase())
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Visa category not found'
                    }
                });
            }
            throw error;
        }

        res.json({
            success: true,
            data: category.fees || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to fetch fees',
                details: error.message
            }
        });
    }
});

// GET /countries/:code/visa-categories/:slug/processing-times - Get processing times for visa category
countriesRouter.get('/:code/visa-categories/:slug/processing-times', async (req, res) => {
    try {
        const { code, slug } = req.params;

        const { data: category, error } = await supabase
            .from('visa_categories')
            .select('processing_times')
            .eq('country_code', code.toUpperCase())
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Visa category not found'
                    }
                });
            }
            throw error;
        }

        res.json({
            success: true,
            data: category.processing_times || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to fetch processing times',
                details: error.message
            }
        });
    }
});

module.exports = countriesRouter;