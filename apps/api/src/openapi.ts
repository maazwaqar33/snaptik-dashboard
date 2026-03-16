/**
 * SnapTik Admin API — OpenAPI 3.0 specification
 * Served at /api/v1/docs via Swagger UI
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SnapTik Admin API',
    version: '1.0.0',
    description: [
      'REST API for the SnapTik Admin Dashboard.',
      '',
      '**Authentication:** All endpoints except `/auth/login`, `/auth/refresh`, `/auth/forgot-password`,',
      '`/auth/reset-password`, and `/auth/register-invite` require a `Bearer` access token.',
      '',
      'Use the **Authorize** button (top-right) and paste the `accessToken` returned by `/auth/login`.',
    ].join('\n'),
    contact: { name: 'SnapTik Engineering', email: 'admin@snaptik.com' },
  },
  servers: [
    { url: 'http://16.16.251.27/api/v1',   description: 'Production (EC2)' },
    { url: 'http://localhost:5001/api/v1',  description: 'Local development' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string', example: 'Invalid credentials' } },
      },
      Admin: {
        type: 'object',
        properties: {
          _id:         { type: 'string', example: '6601a2b3c4d5e6f7a8b9c0d1' },
          email:       { type: 'string', example: 'admin@snaptik.com' },
          name:        { type: 'string', example: 'Super Admin' },
          role:        { type: 'string', enum: ['super_admin','moderator','support','analyst','auditor'] },
          isActive:    { type: 'boolean' },
          lastLoginAt: { type: 'string', format: 'date-time' },
          createdAt:   { type: 'string', format: 'date-time' },
        },
      },
      LoginRequest: {
        type: 'object', required: ['email','password'],
        properties: {
          email:    { type: 'string', format: 'email', example: 'admin@snaptik.com' },
          password: { type: 'string', example: 'Admin@1234!' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: '15-minute JWT — pass as Bearer token' },
          admin: { $ref: '#/components/schemas/Admin' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // ── Health ─────────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        security: [],
        responses: {
          200: {
            description: 'API is running',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                status:    { type: 'string', example: 'ok' },
                uptime:    { type: 'number', example: 3600.5 },
                timestamp: { type: 'string', format: 'date-time' },
              },
            } } },
          },
        },
      },
    },

    // ── Auth ───────────────────────────────────────────────────────────────
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          400: { description: 'Missing fields', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid credentials or inactive account', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'], summary: 'Logout (invalidates refresh token)',
        responses: { 200: { description: 'Logged out' } },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'], summary: 'Refresh access token using httpOnly cookie', security: [],
        responses: {
          200: { description: 'New access token', content: { 'application/json': { schema: {
            type: 'object', properties: { accessToken: { type: 'string' } },
          } } } },
          401: { description: 'No/invalid refresh token' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'], summary: 'Get current admin profile',
        responses: {
          200: { description: 'Current admin', content: { 'application/json': { schema: { $ref: '#/components/schemas/Admin' } } } },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'], summary: 'Request password reset email', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['email'],
          properties: { email: { type: 'string', format: 'email' } },
        } } } },
        responses: { 200: { description: 'Reset email sent (always 200 to prevent email enumeration)' } },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'], summary: 'Reset password using token from email', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['token','password'],
          properties: { token: { type: 'string' }, password: { type: 'string', minLength: 8 } },
        } } } },
        responses: { 200: { description: 'Password reset successful' }, 400: { description: 'Invalid/expired token' } },
      },
    },
    '/auth/register-invite': {
      post: {
        tags: ['Auth'], summary: 'Complete account registration from invite token', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['token','password','name'],
          properties: { token: { type: 'string' }, password: { type: 'string' }, name: { type: 'string' } },
        } } } },
        responses: { 200: { description: 'Account activated', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } } },
      },
    },

    // ── Dashboard ──────────────────────────────────────────────────────────
    '/dashboard': {
      get: {
        tags: ['Dashboard'], summary: 'Dashboard overview stats',
        responses: { 200: { description: 'KPI counts and recent activity' } },
      },
    },
    '/analytics/dashboard': {
      get: {
        tags: ['Analytics'], summary: 'Dashboard KPIs (alias for /analytics/overview)',
        responses: { 200: { description: 'KPI metrics (MAU, DAU, flagged content, open tickets, revenue)' } },
      },
    },
    '/analytics/overview': {
      get: {
        tags: ['Analytics'], summary: 'Platform KPI overview',
        responses: { 200: { description: 'KPI snapshot' } },
      },
    },
    '/analytics/users': {
      get: {
        tags: ['Analytics'], summary: 'User growth time-series',
        parameters: [{ in: 'query', name: 'days', schema: { type: 'integer', enum: [7,14,30,90], default: 30 } }],
        responses: { 200: { description: 'Daily new/active/churned user counts' } },
      },
    },
    '/analytics/content': {
      get: {
        tags: ['Analytics'], summary: 'Top videos, trending hashtags, upload velocity',
        responses: { 200: { description: 'Content analytics' } },
      },
    },
    '/analytics/export': {
      post: {
        tags: ['Analytics'], summary: 'Export analytics as CSV',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['type'],
          properties: {
            type: { type: 'string', enum: ['users','content','reports'] },
            days: { type: 'integer', default: 30 },
          },
        } } } },
        responses: { 200: { description: 'CSV file as JSON blob { csv, filename }' } },
      },
    },

    // ── Users ──────────────────────────────────────────────────────────────
    '/users': {
      get: {
        tags: ['Users'], summary: 'List users (paginated)',
        parameters: [
          { in: 'query', name: 'page',   schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit',  schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['active','banned','suspended','pending'] } },
        ],
        responses: { 200: { description: 'Paginated user list' } },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'], summary: 'Get user by ID',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User object' }, 404: { description: 'Not found' } },
      },
    },
    '/users/{id}/ban': {
      post: {
        tags: ['Users'], summary: 'Ban a user',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: {
          type: 'object', properties: { reason: { type: 'string' } },
        } } } },
        responses: { 200: { description: 'User banned' }, 403: { description: 'Forbidden (RBAC)' } },
      },
    },
    '/users/{id}/unban': {
      post: {
        tags: ['Users'], summary: 'Unban a user',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User unbanned' } },
      },
    },
    '/users/{id}/warn': {
      post: {
        tags: ['Users'], summary: 'Issue a warning to a user',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['reason'], properties: { reason: { type: 'string' } },
        } } } },
        responses: { 200: { description: 'Warning issued' } },
      },
    },
    '/users/bulk-action': {
      post: {
        tags: ['Users'], summary: 'Bulk action on multiple users (ban/unban/warn/delete)',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['action','userIds'],
          properties: {
            action:  { type: 'string', enum: ['ban','unban','warn','delete'] },
            userIds: { type: 'array', items: { type: 'string' } },
            reason:  { type: 'string' },
          },
        } } } },
        responses: { 200: { description: 'Bulk action applied' } },
      },
    },

    // ── Content ────────────────────────────────────────────────────────────
    '/content/moderation-queue': {
      get: {
        tags: ['Content'], summary: 'Get content moderation queue (flagged items)',
        parameters: [
          { in: 'query', name: 'type',   schema: { type: 'string', enum: ['video','comment','all'], default: 'all' } },
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending','approved','rejected','deleted'], default: 'pending' } },
        ],
        responses: { 200: { description: 'List of flagged content items with AI scores' } },
      },
    },
    '/content/{id}/approve': {
      post: {
        tags: ['Content'], summary: 'Approve content (remove from queue)',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Content approved' }, 404: { description: 'Not found' } },
      },
    },
    '/content/{id}/remove': {
      post: {
        tags: ['Content'], summary: 'Remove / reject content',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: {
          type: 'object', properties: { reason: { type: 'string' } },
        } } } },
        responses: { 200: { description: 'Content removed' }, 404: { description: 'Not found' } },
      },
    },
    '/content/{id}/defer': {
      post: {
        tags: ['Content'], summary: 'Defer content for later review',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Content deferred' } },
      },
    },
    '/content/{id}/signed-url': {
      get: {
        tags: ['Content'], summary: 'Get CloudFront signed URL for private video',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Signed URL valid for 1 hour' } },
      },
    },

    // ── Reports ────────────────────────────────────────────────────────────
    '/reports': {
      get: {
        tags: ['Reports'], summary: 'List all reports (paginated)',
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending','in_review','resolved'] } },
          { in: 'query', name: 'type',   schema: { type: 'string', enum: ['spam','harassment','nsfw','misinformation','other'] } },
        ],
        responses: { 200: { description: 'Report list' } },
      },
    },
    '/reports/kanban': {
      get: {
        tags: ['Reports'], summary: 'Reports grouped by status for kanban board',
        responses: { 200: { description: '{ pending: [], in_review: [], resolved: [] }' } },
      },
    },
    '/reports/{id}': {
      get: {
        tags: ['Reports'], summary: 'Get report by ID',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Report object' } },
      },
    },
    '/reports/{id}/status': {
      patch: {
        tags: ['Reports'], summary: 'Update report status',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['status'],
          properties: { status: { type: 'string', enum: ['pending','in_review','resolved'] } },
        } } } },
        responses: { 200: { description: 'Status updated' } },
      },
    },
    '/reports/{id}/resolve': {
      patch: {
        tags: ['Reports'], summary: 'Resolve a report with an action',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['action'],
          properties: {
            action: { type: 'string', enum: ['warn','remove','dismiss'] },
            notes:  { type: 'string' },
          },
        } } } },
        responses: { 200: { description: 'Report resolved' } },
      },
    },
    '/reports/{id}/assign': {
      patch: {
        tags: ['Reports'], summary: 'Assign report to an admin',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['adminId'],
          properties: { adminId: { type: 'string' } },
        } } } },
        responses: { 200: { description: 'Report assigned' } },
      },
    },

    // ── Tickets ────────────────────────────────────────────────────────────
    '/tickets': {
      get: {
        tags: ['Tickets'], summary: 'List support tickets',
        parameters: [
          { in: 'query', name: 'status',   schema: { type: 'string', enum: ['open','in_progress','waiting','resolved','closed'] } },
          { in: 'query', name: 'priority', schema: { type: 'string', enum: ['low','medium','high','urgent'] } },
          { in: 'query', name: 'page',     schema: { type: 'integer', default: 1 } },
        ],
        responses: { 200: { description: 'Paginated ticket list' } },
      },
      post: {
        tags: ['Tickets'], summary: 'Create a new support ticket',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['subject','description','category','userId','userName','userEmail'],
          properties: {
            subject:     { type: 'string' },
            description: { type: 'string' },
            category:    { type: 'string', enum: ['bug','account','content','payment','other'] },
            priority:    { type: 'string', enum: ['low','medium','high','urgent'], default: 'medium' },
            userId:      { type: 'string' },
            userName:    { type: 'string' },
            userEmail:   { type: 'string', format: 'email' },
          },
        } } } },
        responses: { 201: { description: 'Ticket created' } },
      },
    },
    '/tickets/{id}': {
      get: {
        tags: ['Tickets'], summary: 'Get ticket with full message thread',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Ticket with messages' }, 404: { description: 'Not found' } },
      },
    },
    '/tickets/{id}/reply': {
      post: {
        tags: ['Tickets'], summary: 'Add admin reply to a ticket',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['body'], properties: { body: { type: 'string' } },
        } } } },
        responses: { 200: { description: 'Reply added, ticket status auto-set to in_progress' } },
      },
    },
    '/tickets/{id}/status': {
      patch: {
        tags: ['Tickets'], summary: 'Update ticket status',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['status'],
          properties: { status: { type: 'string', enum: ['open','in_progress','waiting','resolved','closed'] } },
        } } } },
        responses: { 200: { description: 'Status updated' } },
      },
    },
    '/tickets/{id}#patch': {
      patch: {
        tags: ['Tickets'], summary: 'Update ticket fields (status, priority, assignedTo)',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Ticket updated' } },
      },
    },

    // ── Settings ───────────────────────────────────────────────────────────
    '/settings': {
      get: {
        tags: ['Settings'], summary: 'Get all platform settings',
        responses: { 200: { description: 'Settings object with platform, moderation, and notification sections' } },
      },
    },
    '/settings/{section}': {
      put: {
        tags: ['Settings'], summary: 'Update a settings section',
        parameters: [{ in: 'path', name: 'section', required: true, schema: { type: 'string', enum: ['platform','moderation','notifications'] } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Settings saved' }, 403: { description: 'Forbidden — super_admin only' } },
      },
    },

    // ── Audit Log ─────────────────────────────────────────────────────────
    '/audit': {
      get: {
        tags: ['Audit'], summary: 'Paginated audit log',
        parameters: [
          { in: 'query', name: 'page',      schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit',     schema: { type: 'integer', default: 50 } },
          { in: 'query', name: 'adminId',   schema: { type: 'string' } },
          { in: 'query', name: 'action',    schema: { type: 'string' } },
          { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
          { in: 'query', name: 'endDate',   schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Audit events (immutable — no DELETE endpoint)' } },
      },
    },
    '/audit/export': {
      get: {
        tags: ['Audit'], summary: 'Export audit log as CSV',
        responses: { 200: { description: 'CSV file download' } },
      },
    },

    // ── Admins ────────────────────────────────────────────────────────────
    '/admins': {
      get: {
        tags: ['Admins'], summary: 'List all admin accounts',
        responses: { 200: { description: 'Admin list' } },
      },
    },
    '/admins/invite': {
      post: {
        tags: ['Admins'], summary: 'Invite a new admin by email',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['email','name','role'],
          properties: {
            email: { type: 'string', format: 'email' },
            name:  { type: 'string' },
            role:  { type: 'string', enum: ['moderator','support','analyst','auditor'] },
          },
        } } } },
        responses: { 200: { description: 'Invite email sent, invite token created (72h expiry)' } },
      },
    },
    '/admins/{id}/toggle-active': {
      patch: {
        tags: ['Admins'], summary: 'Activate or deactivate an admin account',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Active status toggled' }, 403: { description: 'Cannot deactivate yourself' } },
      },
    },
    '/admins/{id}/role': {
      patch: {
        tags: ['Admins'], summary: 'Change an admin role',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['role'],
          properties: { role: { type: 'string', enum: ['moderator','support','analyst','auditor','super_admin'] } },
        } } } },
        responses: { 200: { description: 'Role updated' } },
      },
    },
  },
  tags: [
    { name: 'System',    description: 'Health and status' },
    { name: 'Auth',      description: 'Login, logout, token refresh, password reset' },
    { name: 'Dashboard', description: 'Overview stats for the dashboard home page' },
    { name: 'Analytics', description: 'Platform metrics and CSV exports' },
    { name: 'Users',     description: 'User management — ban, warn, bulk actions' },
    { name: 'Content',   description: 'Content moderation queue — approve, remove, defer' },
    { name: 'Reports',   description: 'Community reports — kanban board and resolution' },
    { name: 'Tickets',   description: 'Support ticket management and replies' },
    { name: 'Audit',     description: 'Immutable admin action audit trail' },
    { name: 'Settings',  description: 'Platform settings (super_admin only)' },
    { name: 'Admins',    description: 'Admin account management and invitations' },
  ],
};
