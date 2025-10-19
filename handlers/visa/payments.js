const express = require('express');
const { randomUUID } = require('crypto');
const paymentsRouter = express.Router();
const supabase = require('../../utils/supabaseClient');
const { authenticateToken, requireOwnership } = require('../../middleware/auth');
const { validateBody, CreatePaymentSchema } = require('./validation');

// POST /applications/:id/payments - Create payment
paymentsRouter.post('/applications/:id/payments', authenticateToken, requireOwnership('application'), validateBody(CreatePaymentSchema), async (req, res) => {
    try {
        const { id: applicationId } = req.params;
        const { provider } = req.body;
        const idempotencyKey = req.headers['idempotency-key'];

        // Validate required fields
        if (!provider) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Provider is required'
                }
            });
        }

        if (!idempotencyKey) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Idempotency-Key header is required'
                }
            });
        }

        // Check for existing payment with same idempotency key
        const { data: existingPayment } = await supabase
            .from('payments')
            .select('*')
            .eq('idempotency_key', idempotencyKey)
            .single();

        if (existingPayment) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'CONFLICT',
                    message: 'Payment already exists with this idempotency key'
                },
                data: existingPayment
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

        // Calculate payment amount (placeholder - in production, calculate from visa category fees)
        const amount = 100.00; // Placeholder amount
        const currency = 'USD';

        // Process payment based on provider
        let paymentStatus = 'pending';
        let receiptUrl = null;

        if (provider === 'mock') {
            // Mock payment - always succeeds
            paymentStatus = 'succeeded';
            receiptUrl = `https://example.com/receipts/${randomUUID()}`;
        } else {
            // TODO: Integrate with actual payment providers (Stripe, etc.)
            // For now, mark as pending
            paymentStatus = 'pending';
        }

        const payment = {
            id: randomUUID(),
            application_id: applicationId,
            provider,
            amount,
            currency,
            status: paymentStatus,
            receipt_url: receiptUrl,
            idempotency_key: idempotencyKey
        };

        const { data, error } = await supabase
            .from('payments')
            .insert(payment)
            .select()
            .single();

        if (error) throw error;

        // If payment succeeded, update application payment status
        if (paymentStatus === 'succeeded') {
            await supabase
                .from('applications')
                .update({ payment_status: 'succeeded' })
                .eq('id', applicationId);
        }

        res.status(201).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to create payment',
                details: error.message
            }
        });
    }
});

// GET /applications/:id/payments/:paymentId - Get payment details
paymentsRouter.get('/applications/:id/payments/:paymentId', authenticateToken, requireOwnership('application'), async (req, res) => {
    try {
        const { id: applicationId, paymentId } = req.params;

        // Verify payment belongs to user's application
        const { data: payment, error } = await supabase
            .from('payments')
            .select(`
                *,
                applications!inner(user_id)
            `)
            .eq('id', paymentId)
            .eq('application_id', applicationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Payment not found'
                    }
                });
            }
            throw error;
        }

        // Check if application belongs to user
        if (payment.applications.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied'
                }
            });
        }

        // Remove the nested applications data from response
        const { applications, ...cleanPayment } = payment;

        res.json({
            success: true,
            data: cleanPayment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to fetch payment',
                details: error.message
            }
        });
    }
});

module.exports = paymentsRouter;