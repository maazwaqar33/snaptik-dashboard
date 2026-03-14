'use client';

import { useState, useCallback } from 'react';
import { Ticket as TicketIcon } from 'lucide-react';
import { useAbility } from '@/hooks/use-ability';
import { TicketsTable } from '@/components/tickets/tickets-table';
import { seedTickets, type Ticket, type TicketStatus } from '@/types/tickets';

// Stable seed (module-level so it doesn't re-create on re-render)
const INITIAL_TICKETS = seedTickets(40);

export default function TicketsPage() {
  const ability = useAbility();

  if (!ability.can('read', 'tickets')) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <TicketIcon className="h-10 w-10 text-[#AAAAAA]/40" />
        <p className="text-sm text-[#AAAAAA]">You don&apos;t have permission to view tickets.</p>
      </div>
    );
  }

  return <TicketsContent />;
}

function TicketsContent() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);

  const handleStatusChange = useCallback((ticketId: string, status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, status } : t)),
    );
  }, []);

  const open       = tickets.filter((t) => t.status === 'open').length;
  const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
  const waiting    = tickets.filter((t) => t.status === 'waiting').length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-white">Support Tickets</h1>
          <p className="mt-1 text-sm text-[#AAAAAA]">
            Click a row to open the reply panel &mdash; status changes are saved automatically
          </p>
        </div>

        {/* Quick counts */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#007AFF]/10 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#007AFF]" />
            <span className="text-xs font-semibold text-[#007AFF]">{open} open</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#FF9500]/10 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#FF9500]" />
            <span className="text-xs font-semibold text-[#FF9500]">{inProgress} in progress</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#AAAAAA]" />
            <span className="text-xs font-semibold text-[#AAAAAA]">{waiting} waiting</span>
          </div>
        </div>
      </div>

      <TicketsTable tickets={tickets} onStatusChange={handleStatusChange} />
    </div>
  );
}
