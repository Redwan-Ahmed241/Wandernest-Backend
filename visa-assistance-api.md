# Visa Assistance API (v1) — Backend Contract

Audience: Express/Node backend implementer
Scope: Minimal but precise contract for frontend integration
Base URL: `/api/visa/v1`
Media type: `application/json; charset=utf-8`
Auth: JWT Bearer for application-related endpoints

## Conventions

- Success envelope: `{ "success": true, "data": <payload>, "meta?: object> }`
- Error envelope: `{ "success": false, "error": { "code": string, "message": string, "details?: object } }`
- Timestamps: ISO 8601 UTC strings
- Pagination (list endpoints): query `page` (default 1), `limit` (default 20, max 100);
  response `meta = { page, limit, total, totalPages }`

## Core Schemas (shape must be stable)

- Country: `{ code: string(ISO alpha-2), name: string, visa_policy_url?: string, notes?: string }`
- Fee: `{ type: 'government'|'service'|'convenience', amount: number, currency: string, refundable: boolean }`
- ProcessingTime: `{ type: 'standard'|'express'|'urgent', minDays: number, maxDays: number, notes?: string }`
- Requirement: `{ key: string, label: string, description?: string, required: boolean, documentType: 'pdf'|'image'|'doc'|'other', mimeTypes?: string[], maxSizeMB?: number }`
- VisaCategory: `{ id: string, countryCode: string, slug: string, name: string, description?: string, validityDays: number, maxStayDays: number, multipleEntry: boolean, fees: Fee[], processingTimes: ProcessingTime[], requirements: Requirement[] }`
- Applicant: `{ firstName, lastName, dateOfBirth(YYYY-MM-DD), nationality(code), passportNumber, passportExpiry(YYYY-MM-DD), email, phone? }`
- Application: `{ id: string, userId: string, countryCode: string, categorySlug: string, applicant: Applicant, travel: { entryDate, exitDate, purpose }, status: 'draft'|'submitted'|'under_review'|'additional_info_required'|'approved'|'rejected'|'withdrawn', paymentStatus: 'unpaid'|'pending'|'succeeded'|'failed'|'refunded', createdAt: ISO, updatedAt: ISO }`
- Document: `{ id: string, applicationId: string, requirementKey: string, fileName: string, url: string, mimeType: string, sizeBytes: number, status: 'received'|'approved'|'rejected', reviewerNote?: string, uploadedAt: ISO }`
- Appointment: `{ id: string, applicationId: string, centerCode: string, dateTime: ISO, timezone: string, status: 'scheduled'|'rescheduled'|'canceled'|'attended', location: { address: string, mapUrl?: string } }`
- Payment: `{ id: string, applicationId: string, provider: 'stripe'|'bkash'|'sslcommerz'|'mock', amount: number, currency: string, status: 'pending'|'succeeded'|'failed'|'refunded', createdAt: ISO, receiptUrl?: string, idempotencyKey?: string }`
- StatusEvent: `{ id: string, applicationId: string, status: Application.status, message?: string, occurredAt: ISO }`

## Public Endpoints (no auth)

- GET `/countries`
  - Query: `page, limit, q?`
  - 200: `{ success, data: Country[], meta }`
- GET `/countries/:code`
  - 200: `{ success, data: Country }` | 404
- GET `/countries/:code/visa-categories`
  - 200: `{ success, data: VisaCategory[], meta }`
- GET `/countries/:code/visa-categories/:slug`
  - 200: `{ success, data: VisaCategory }` | 404
- GET `/countries/:code/visa-categories/:slug/requirements`
  - 200: `{ success, data: Requirement[] }`
- GET `/countries/:code/visa-categories/:slug/fees`
  - 200: `{ success, data: Fee[] }`
- GET `/countries/:code/visa-categories/:slug/processing-times`
  - 200: `{ success, data: ProcessingTime[] }`

## Applications (auth: Bearer)

- POST `/applications`
  - Body: `{ countryCode, categorySlug, applicant: Applicant, travel: { entryDate, exitDate, purpose } }`
  - 201: `{ success, data: Application }` (status=`draft`)
- GET `/applications`
  - Query: `page, limit, status?, countryCode?, categorySlug?, dateFrom?, dateTo?`
  - 200: `{ success, data: Application[], meta }`
- GET `/applications/:id`
  - 200: `{ success, data: Application }` | 404
- PATCH `/applications/:id`
  - Body: partial `{ applicant?, travel? }`
  - 200: `{ success, data: Application }`
- POST `/applications/:id/submit`
  - Preconditions: required documents uploaded; fees covered
  - 200: `{ success, data: Application }` (status→`submitted`) | 409 on violation
- POST `/applications/:id/withdraw`
  - 200: `{ success, data: Application }` (status→`withdrawn`) | 409 invalid transition
- GET `/applications/:id/status-events`
  - 200: `{ success, data: StatusEvent[] }`

## Documents (auth: Bearer)

- POST `/applications/:id/documents` (multipart/form-data)
  - Fields: `requirementKey` (text), `file` (binary)
  - 201: `{ success, data: Document }`
- GET `/applications/:id/documents`
  - 200: `{ success, data: Document[] }`
- DELETE `/applications/:id/documents/:docId`
  - 204

## Appointments (auth: Bearer)

- POST `/applications/:id/appointments`
  - Body: `{ centerCode, dateTime(ISO), timezone }`
  - 201: `{ success, data: Appointment }`
- PATCH `/applications/:id/appointments/:appointmentId`
  - Body: partial `{ dateTime?, timezone?, status? }`
  - 200: `{ success, data: Appointment }`
- DELETE `/applications/:id/appointments/:appointmentId`
  - 204

## Payments (auth: Bearer)

- POST `/applications/:id/payments`
  - Headers: `Idempotency-Key: <uuid>`
  - Body: `{ provider: 'mock'|'stripe'|'bkash'|'sslcommerz' }`
  - 201: `{ success, data: Payment }` | 409 on duplicate with mismatched params
- GET `/applications/:id/payments/:paymentId`
  - 200: `{ success, data: Payment }`

## Errors & Codes

- Codes: `AUTH_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `RATE_LIMITED`
- Example:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid input",
      "details": { "applicant.email": "Must be a valid email" }
    }
  }
  ```

## Auth, CORS, Security

- Auth: `Authorization: Bearer <jwt>` for non-public routes.
- CORS: allow frontend origin; headers `Authorization, Content-Type`; methods `GET, POST, PATCH, DELETE, OPTIONS`.
- Security: helmet, rate-limit (e.g., 60 rpm), JSON body limit (1–5MB), file size/mime validation for uploads.

## Notes for Implementation (Express)

- Middleware order: `helmet` → `cors` → `morgan` → `rateLimit` → `express.json({limit})` → routes → error handler
- Validation: zod/joi for all bodies, params, queries
- Storage: DB for metadata; S3/GCS for documents (store signed URLs); timestamps in UTC
- Idempotency: cache/store `Idempotency-Key` for payments to return the same result on retry

---

This contract is stable. If you add fields, maintain backward compatibility and keep the envelope/paths unchanged.
