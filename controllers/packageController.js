const { supabase } = require('../config/db');

// Get all packages
const getAllPackages = async (req, res) => {
    try {
        const { data: packages, error } = await supabase
            .from('packages_package')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get packages error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch packages',
                error: error.message
            });
        }

        res.json({
            success: true,
            data: { packages }
        });
    } catch (error) {
        console.error('Get all packages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get package by ID
const getPackageById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: pkg, error } = await supabase
            .from('packages_package')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !pkg) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        res.json({
            success: true,
            data: pkg
        });
    } catch (error) {
        console.error('Get package error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getAllPackages,
    getPackageById
};
