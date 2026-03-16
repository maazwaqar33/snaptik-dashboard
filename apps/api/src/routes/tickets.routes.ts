import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { can }         from '../middleware/rbac';
import { auditLog }    from '../middleware/audit';
import * as tickets    from '../controllers/tickets.controller';

const router: Router = Router();
router.use(requireAuth);

router.get('/',              can('read','tickets'),   tickets.listTickets);
router.get('/:id',           can('read','tickets'),   tickets.getTicket);
router.post('/',             can('update','tickets'),  auditLog('ticket.create','ticket'), tickets.createTicket);
router.post('/:id/reply',    can('reply','tickets'),   auditLog('ticket.reply','ticket'),  tickets.replyToTicket);
router.patch('/:id/status',  can('update','tickets'),  auditLog('ticket.update','ticket'), tickets.updateTicketStatus);
router.patch('/:id',         can('update','tickets'),  auditLog('ticket.update','ticket'), tickets.updateTicket);

export default router;
