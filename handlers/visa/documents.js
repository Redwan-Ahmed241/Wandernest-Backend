const express = require('express');
const multer = require('multer');
const { randomUUID } = require('crypto');
const documentsRouter = express.Router();
const supabase = require('../../utils/supabaseClient');
const { authenticateToken, requireOwnership } = require('../../middleware/auth');
const { validateBody, UploadDocumentSchema } = require('./validation');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common document types
        const allowedMimes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// POST /applications/:id/documents - Upload document
documentsRouter.post('/applications/:id/documents', authenticateToken, requireOwnership('application'), upload.single('file'), validateBody(UploadDocumentSchema), async (req, res) => {
    try {
        const { id: applicationId } = req.params;
        const { requirementKey } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'No file uploaded'
                }
            });
        }

        if (!requirementKey) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'requirementKey is required'
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

        // Upload file to Supabase Storage (placeholder - implement actual upload)
        const fileName = `${randomUUID()}_${file.originalname}`;
        const fileUrl = `https://example.com/uploads/${fileName}`; // Placeholder URL

        // In production, you would upload to Supabase Storage or another service
        // const { data: uploadData, error: uploadError } = await supabase.storage
        //     .from('documents')
        //     .upload(fileName, file.buffer, {
        //         contentType: file.mimetype
        //     });

        const document = {
            id: randomUUID(),
            application_id: applicationId,
            requirement_key: requirementKey,
            file_name: file.originalname,
            url: fileUrl,
            mime_type: file.mimetype,
            size_bytes: file.size,
            status: 'received'
        };

        const { data, error } = await supabase
            .from('documents')
            .insert(document)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data
        });
    } catch (error) {
        if (error.message === 'Invalid file type') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid file type. Allowed: PDF, JPEG, PNG, GIF, DOC, DOCX'
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to upload document',
                details: error.message
            }
        });
    }
});

// GET /applications/:id/documents - List documents for application
documentsRouter.get('/applications/:id/documents', authenticateToken, requireOwnership('application'), async (req, res) => {
    try {
        const { id: applicationId } = req.params;

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

        const { data: documents, error } = await supabase
            .from('documents')
            .select('*')
            .eq('application_id', applicationId)
            .order('uploaded_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: documents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to fetch documents',
                details: error.message
            }
        });
    }
});

// DELETE /applications/:id/documents/:docId - Delete document
documentsRouter.delete('/applications/:id/documents/:docId', authenticateToken, requireOwnership('application'), async (req, res) => {
    try {
        const { id: applicationId, docId } = req.params;

        // Verify document belongs to user's application
        const { data: document, error: docError } = await supabase
            .from('documents')
            .select('id, url')
            .eq('id', docId)
            .eq('application_id', applicationId)
            .single();

        if (docError || !document) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Document not found'
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

        // Delete from database
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', docId);

        if (error) throw error;

        // TODO: Delete file from storage
        // await supabase.storage.from('documents').remove([fileName]);

        res.status(204).send();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to delete document',
                details: error.message
            }
        });
    }
});

module.exports = documentsRouter;