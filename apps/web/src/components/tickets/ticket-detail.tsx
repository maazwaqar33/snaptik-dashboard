'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, ChevronDown } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/cn';
import { apiClient } from '@/lib/api';
import { useAbility } from '@/hooks/use-ability';
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORY_LABELS,
  type Ticket,
  type TicketStatus,
  type TicketMessage,
} from '@/types/tickets';

interface TicketDetailProps {
  ticket: Ticket;
  onClose: () => void;
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
}

const STATUS_OPTIONS: TicketStatus[] = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];

export function TicketDetail({ ticket, onClose, onStatusChange }: TicketDetailProps) {
  const ability = useAbility();
  const canReply = ability.can('reply', 'tickets');

  const [messages, setMessages] = useState<TicketMessage[]>(ticket.messages);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    const optimistic: TicketMessage = {
      _id:        `tmp-${Date.now()}`,
      authorId:   'me',
      authorName: 'You',
      isAgent:    true,
      body:       reply.trim(),
      createdAt:  new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setReply('');
    try {
      await apiClient.post(`/tickets/${ticket._id}/reply`, { body: optimistic.body });
    } catch {
      // optimistic — message stays visible
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (s: TicketStatus) => {
    setStatusOpen(false);
    onStatusChange(ticket._id, s);
    try {
      await apiClient.patch(`/tickets/${ticket._id}/status`, { status: s });
    } catch {
      // ignore
    }
  };

  const cfg = STATUS_CONFIG[ticket.status];
  const pri = PRIORITY_CONFIG[ticket.priority];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 p-5">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-[#AAAAAA]">{ticket.ticketId}</p>
          <h2 className="mt-0.5 font-outfit text-base font-semibold text-white leading-snug">
            {ticket.subject}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => setStatusOpen((v) => !v)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
                  cfg.bg, cfg.text,
                  'hover:opacity-80',
                )}
              >
                {cfg.label}
                <ChevronDown className="h-3 w-3" />
              </button>
              {statusOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setStatusOpen(false)} />
                  <div className="absolute left-0 z-30 mt-1 w-36 rounded-xl border border-white/10 bg-[#121212] py-1 shadow-2xl">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/5',
                          STATUS_CONFIG[s].text,
                        )}
                      >
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Priority */}
            <span className="flex items-center gap-1.5 text-xs text-[#AAAAAA]">
              <span className={cn('h-2 w-2 rounded-full', pri.dot)} />
              {pri.label}
            </span>

            {/* Category */}
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-[#AAAAAA]">
              {CATEGORY_LABELS[ticket.category]}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-[#AAAAAA] transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* User info */}
      <div className="shrink-0 border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#007AFF]/20 text-xs font-bold text-[#007AFF]">
            {ticket.user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold text-white">@{ticket.user.username}</p>
            <p className="text-[11px] text-[#AAAAAA]">{ticket.user.email}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11px] text-[#AAAAAA]">Opened</p>
            <p className="text-xs text-white">
              {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-5">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={cn(
              'flex flex-col gap-1',
              msg.isAgent ? 'items-end' : 'items-start',
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#AAAAAA]">{msg.authorName}</span>
              <span className="text-[10px] text-[#AAAAAA]/60">
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
              </span>
            </div>
            <div
              className={cn(
                'max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed',
                msg.isAgent
                  ? 'bg-[#007AFF]/20 text-white'
                  : 'bg-white/8 text-white/90',
              )}
            >
              {msg.body}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply box */}
      {canReply && ticket.status !== 'closed' && (
        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="flex gap-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend();
              }}
              placeholder="Type a reply… (Ctrl+Enter to send)"
              rows={3}
              className="flex-1 resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-[#AAAAAA] outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!reply.trim() || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl bg-[#007AFF] text-white transition-colors hover:bg-[#007AFF]/80 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
