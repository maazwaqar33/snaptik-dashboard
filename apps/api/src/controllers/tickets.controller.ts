import type { Request, Response } from 'express';
import mongoose, { Schema, type Document } from 'mongoose';
import { AuditLog } from '../models/audit.model';

// ---------------------------------------------------------------------------
// Ticket model (inline — no separate model file required by spec)
// ---------------------------------------------------------------------------

type TicketStatus   = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketCategory = 'bug' | 'account' | 'content' | 'payment' | 'other';
type MessageSender  = 'user' | 'admin';

interface ITicketMessage {
  _id:        mongoose.Types.ObjectId;
  sender:     MessageSender;
  adminId?:   string;
  adminName?: string;
  text:       string;
  createdAt:  Date;
}

interface ITicket extends Document {
  subject:      string;
  description:  string;
  status:       TicketStatus;
  priority:     TicketPriority;
  category:     TicketCategory;
  userId:       string;
  userName:     string;
  userEmail:    string;
  assignedTo?:  { _id: mongoose.Types.ObjectId; name: string } | null;
  messages:     ITicketMessage[];
  messageCount: number;
  createdAt:    Date;
  updatedAt:    Date;
}

const TicketMessageSchema = new Schema<ITicketMessage>(
  {
    sender:    { type: String, enum: ['user', 'admin'], required: true },
    adminId:   String,
    adminName: String,
    text:      { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: true },
);

const TicketSchema = new Schema<ITicket>(
  {
    subject:     { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status:      { type: String, enum: ['open','in_progress','waiting','resolved','closed'], default: 'open' },
    priority:    { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
    category:    { type: String, enum: ['bug','account','content','payment','other'], required: true },
    userId:      { type: String, required: true },
    userName:    { type: String, required: true },
    userEmail:   { type: String, required: true },
    assignedTo: {
      _id:  { type: Schema.Types.ObjectId, ref: 'Admin' },
      name: String,
    },
    messages:     { type: [TicketMessageSchema], default: [] },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'tickets' },
);

TicketSchema.index({ status: 1, createdAt: -1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ userId: 1 });
TicketSchema.index({ 'assignedTo._id': 1 });

// Lazily register model to avoid "Cannot overwrite model" errors in hot-reload
const Ticket = (mongoose.models['Ticket'] as mongoose.Model<ITicket>) ??
  mongoose.model<ITicket>('Ticket', TicketSchema);

// ---------------------------------------------------------------------------
// Helper — map a ticket document to the summary shape (no messages)
// ---------------------------------------------------------------------------
function toTicketSummary(t: ITicket) {
  return {
    _id:          t._id,
    subject:      t.subject,
    description:  t.description,
    status:       t.status,
    priority:     t.priority,
    category:     t.category,
    userId:       t.userId,
    userName:     t.userName,
    userEmail:    t.userEmail,
    assignedTo:   t.assignedTo ?? null,
    messageCount: t.messageCount,
    createdAt:    t.createdAt,
    updatedAt:    t.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// GET /tickets
// ---------------------------------------------------------------------------
export async function listTickets(req: Request, res: Response): Promise<void> {
  const page   = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
  const limit  = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const skip   = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.status)     filter.status     = req.query.status;
  if (req.query.priority)   filter.priority   = req.query.priority;
  if (req.query.assignedTo) filter['assignedTo._id'] = req.query.assignedTo;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter, { messages: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Ticket.countDocuments(filter),
  ]);

  res.json({ tickets, total, page, limit });
}

// ---------------------------------------------------------------------------
// GET /tickets/:id
// ---------------------------------------------------------------------------
export async function getTicket(req: Request, res: Response): Promise<void> {
  const ticket = await Ticket.findById(req.params.id).lean();
  if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return; }
  res.json(ticket);
}

// ---------------------------------------------------------------------------
// POST /tickets/:id/reply
// ---------------------------------------------------------------------------
export async function replyToTicket(req: Request, res: Response): Promise<void> {
  const { text } = req.body ?? {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return; }

  const message: Omit<ITicketMessage, '_id'> = {
    sender:    'admin',
    adminId:   req.admin.sub,
    adminName: req.admin.name,
    text:      text.trim(),
    createdAt: new Date(),
  };

  ticket.messages.push(message as ITicketMessage);
  ticket.messageCount = ticket.messages.length;

  // Auto-move to in_progress if still open
  if (ticket.status === 'open') ticket.status = 'in_progress';

  await ticket.save();

  await AuditLog.create({
    adminId:    req.admin.sub,
    adminName:  req.admin.name,
    adminEmail: req.admin.email,
    adminRole:  req.admin.role,
    action:     'ticket.reply',
    targetId:   String(ticket._id),
    targetType: 'ticket',
    detail:     `Replied to ticket: ${ticket.subject}`,
    ipAddress:  req.ip,
    userAgent:  req.headers['user-agent'],
  });

  res.json({
    message: 'Replied',
    ticket: {
      _id:          ticket._id,
      status:       ticket.status,
      messageCount: ticket.messageCount,
    },
  });
}

// ---------------------------------------------------------------------------
// PATCH /tickets/:id
// ---------------------------------------------------------------------------
export async function updateTicket(req: Request, res: Response): Promise<void> {
  const { status, priority, assignedTo } = req.body ?? {};

  const allowed = {
    status:    ['open','in_progress','waiting','resolved','closed'],
    priority:  ['low','medium','high','urgent'],
  };

  if (status   && !allowed.status.includes(status)) {
    res.status(400).json({ error: `Invalid status: ${status}` });
    return;
  }
  if (priority && !allowed.priority.includes(priority)) {
    res.status(400).json({ error: `Invalid priority: ${priority}` });
    return;
  }

  const update: Record<string, unknown> = {};
  if (status   !== undefined) update.status   = status;
  if (priority !== undefined) update.priority = priority;

  // assignedTo can be null (unassign) or { _id, name }
  if (assignedTo !== undefined) {
    if (assignedTo === null) {
      update.assignedTo = null;
    } else if (assignedTo._id && assignedTo.name) {
      update.assignedTo = { _id: assignedTo._id, name: assignedTo.name };
    } else {
      res.status(400).json({ error: 'assignedTo must be null or { _id, name }' });
      return;
    }
  }

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  const ticket = await Ticket.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, projection: { messages: 0 } },
  );
  if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return; }

  await AuditLog.create({
    adminId:    req.admin.sub,
    adminName:  req.admin.name,
    adminEmail: req.admin.email,
    adminRole:  req.admin.role,
    action:     'ticket.update',
    targetId:   String(ticket._id),
    targetType: 'ticket',
    detail:     `Updated ticket fields: ${Object.keys(update).join(', ')}`,
    ipAddress:  req.ip,
    userAgent:  req.headers['user-agent'],
  });

  res.json(toTicketSummary(ticket));
}

// ---------------------------------------------------------------------------
// POST /tickets — create a new ticket
// ---------------------------------------------------------------------------
export async function createTicket(req: Request, res: Response): Promise<void> {
  const { subject, description, category, userId, userName, userEmail, priority } = req.body ?? {};

  if (!subject || !description || !category || !userId || !userName || !userEmail) {
    res.status(400).json({ error: 'subject, description, category, userId, userName, and userEmail are required' });
    return;
  }

  const validCategories: TicketCategory[] = ['bug', 'account', 'content', 'payment', 'other'];
  if (!validCategories.includes(category as TicketCategory)) {
    res.status(400).json({ error: `category must be one of: ${validCategories.join(', ')}` });
    return;
  }

  const validPriorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
  if (priority !== undefined && !validPriorities.includes(priority as TicketPriority)) {
    res.status(400).json({ error: `priority must be one of: ${validPriorities.join(', ')}` });
    return;
  }

  const ticket = await Ticket.create({
    subject:     String(subject).trim(),
    description: String(description),
    category:    category as TicketCategory,
    userId:      String(userId),
    userName:    String(userName),
    userEmail:   String(userEmail),
    priority:    priority ?? 'medium',
  });

  res.status(201).json(toTicketSummary(ticket));
}

// ---------------------------------------------------------------------------
// PATCH /tickets/:id/status — targeted status-only update
// ---------------------------------------------------------------------------
export async function updateTicketStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body ?? {};

  const validStatuses: TicketStatus[] = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
  if (!status || !validStatuses.includes(status as TicketStatus)) {
    res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const ticket = await Ticket.findByIdAndUpdate(
    req.params.id,
    { $set: { status: status as TicketStatus } },
    { new: true, projection: { messages: 0 } },
  );
  if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return; }

  await AuditLog.create({
    adminId:    req.admin.sub,
    adminName:  req.admin.name,
    adminEmail: req.admin.email,
    adminRole:  req.admin.role,
    action:     'ticket.update',
    targetId:   String(ticket._id),
    targetType: 'ticket',
    detail:     `Updated ticket status to: ${status}`,
    ipAddress:  req.ip,
    userAgent:  req.headers['user-agent'],
  });

  res.json(toTicketSummary(ticket));
}
