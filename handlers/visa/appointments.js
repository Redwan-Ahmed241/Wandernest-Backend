const express = require('express');
const { randomUUID } = require('crypto');
const appointmentsRouter = express.Router();
const supabase = require('../../utils/supabaseClient');
const { authenticateToken, requireOwnership } = require('../../middleware/auth');
const { validateBody, CreateAppointmentSchema, UpdateAppointmentSchema } = require('./validation');

// POST /applications/:id/appointments - Create appointment
appointmentsRouter.post('/applications/:id/appointments', authenticateToken, requireOwnership('application'), validateBody(CreateAppointmentSchema), async (req, res) => {
    try {
        const { id: applicationId } = req.params;
        const { centerCode, dateTime, timezone } = req.body;

        // Validate required fields
        if (!centerCode || !dateTime || !timezone) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields',
                    details: {
                        centerCode: !centerCode ? 'Required' : null,
                        dateTime: !dateTime ? 'Required' : null,
                        timezone: !timezone ? 'Required' : null
                    }
                }
            });
        }

        // Verify application belongs to user
        const { data: application, error: appError } = await supabase
            .from('applications')
            .select('id')
            .eq('id', applicationId)
            .eq('user_id', req.user.id)
            .single();

        if (appError || !application) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Application not found'
                }
            });
        }

        const appointment = {
            id: randomUUID(),
            application_id: applicationId,
            center_code: centerCode,
            date_time: dateTime,
            timezone,
            status: 'scheduled',
            location: {} // Can be populated later
        };

        const { data, error } = await supabase
            .from('appointments')
            .insert(appointment)
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
                message: 'Failed to create appointment',
                details: error.message
            }
        });
    }
});

// PATCH /applications/:id/appointments/:appointmentId - Update appointment
appointmentsRouter.patch('/applications/:id/appointments/:appointmentId', authenticateToken, requireOwnership('application'), validateBody(UpdateAppointmentSchema), async (req, res) => {
    try {
        const { id: applicationId, appointmentId } = req.params;
        const updates = req.body;

        // Only allow updates to certain fields
        const allowedFields = ['dateTime', 'timezone', 'status'];
        const filteredUpdates = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                // Convert camelCase to snake_case for database
                const dbField = field === 'dateTime' ? 'date_time' : field;
                filteredUpdates[dbField] = updates[field];
            }
        }

        if (Object.keys(filteredUpdates).length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'No valid fields to update'
                }
            });
        }

        // Verify appointment belongs to user's application
        const { data: appointment, error } = await supabase
            .from('appointments')
            .update(filteredUpdates)
            .eq('id', appointmentId)
            .eq('application_id', applicationId)
            .select(`
                *,
                applications!inner(user_id)
            `)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Appointment not found'
                    }
                });
            }
            throw error;
        }

        // Check if application belongs to user
        if (appointment.applications.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied'
                }
            });
        }

        // Remove the nested applications data from response
        const { applications, ...cleanAppointment } = appointment;

        res.json({
            success: true,
            data: cleanAppointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to update appointment',
                details: error.message
            }
        });
    }
});

// DELETE /applications/:id/appointments/:appointmentId - Delete appointment
appointmentsRouter.delete('/applications/:id/appointments/:appointmentId', authenticateToken, requireOwnership('application'), async (req, res) => {
    try {
        const { id: applicationId, appointmentId } = req.params;

        // Verify appointment belongs to user's application
        const { data: appointment, error: findError } = await supabase
            .from('appointments')
            .select(`
                id,
                applications!inner(user_id)
            `)
            .eq('id', appointmentId)
            .eq('application_id', applicationId)
            .single();

        if (findError || !appointment) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Appointment not found'
                }
            });
        }

        // Check if application belongs to user
        if (appointment.applications.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied'
                }
            });
        }

        // Delete appointment
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', appointmentId);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to delete appointment',
                details: error.message
            }
        });
    }
});

module.exports = appointmentsRouter;