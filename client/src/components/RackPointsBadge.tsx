import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Coins, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RackPointsLedgerEntry } from "@shared/schema";

interface RackPointsState {
  rackPoints: number;
  streakDays: number;
  streakLastDay: string | null;
}

const REASON_LABELS: Record<string, string> = {
  login_streak: "Daily login",
  match_win: "Match win",
  upset_bonus: "Upset bonus",
  admin_adjustment: "Admin adjustment",
};

function formatRelativeTime(iso: string | Date): string {
  const t = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function RackPointsBadge() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const {
    data: state,
    isLoading: stateLoading,
    isError: stateIsError,
  } = useQuery<RackPointsState>({
    queryKey: ["/api/me/rack-points"],
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
  });

  const { data: ledger, isLoading: ledgerLoading } = useQuery<
    RackPointsLedgerEntry[]
  >({
    queryKey: ["/api/me/rack-points/ledger"],
    enabled: open,
    staleTime: 10 * 1000,
  });

  if (stateLoading) {
    return (
      <div
        className="hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold
                   bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-300/60"
        data-testid="badge-rack-points-loading"
      >
        <Coins className="h-4 w-4" />
        <span>—</span>
      </div>
    );
  }

  // On error or missing state (logged out, server hiccup), render nothing rather
  // than a permanent loading shimmer.
  if (stateIsError || !state) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 rounded-xl px-2.5 md:px-3 py-2 text-xs md:text-sm font-bold
                     bg-emerald-500/15 hover:bg-emerald-500/25 ring-1 ring-emerald-400/40
                     text-emerald-200 transition items-center"
          data-testid="badge-rack-points"
          aria-label={`${state.rackPoints} rack points, ${state.streakDays} day streak`}
        >
          <Coins className="h-4 w-4 text-emerald-300" />
          <span data-testid="text-rack-points-balance">
            {state.rackPoints.toLocaleString()}
          </span>
          {state.streakDays > 0 && (
            <span
              className="ml-1 inline-flex items-center gap-0.5 text-orange-300"
              data-testid="text-rack-points-streak"
            >
              <Flame className="h-3.5 w-3.5" />
              {state.streakDays}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 bg-zinc-950 border border-emerald-500/30 text-emerald-100 p-0"
        data-testid="popover-rack-points"
      >
        <div className="px-4 pt-3 pb-2 border-b border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-400/70">
                Rack Points
              </div>
              <div
                className="text-2xl font-bold text-emerald-200"
                data-testid="text-popover-balance"
              >
                {state.rackPoints.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400/70">
                Streak
              </div>
              <div
                className="inline-flex items-center gap-1 text-2xl font-bold text-orange-300"
                data-testid="text-popover-streak"
              >
                <Flame className="h-5 w-5" />
                {state.streakDays}
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-2 border-b border-emerald-500/10">
          <div className="text-[10px] uppercase tracking-wider text-emerald-400/70">
            Recent activity
          </div>
        </div>
        <ScrollArea className="max-h-72">
          {ledgerLoading ? (
            <div
              className="flex items-center justify-center py-6 text-emerald-400/70"
              data-testid="status-ledger-loading"
            >
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading…
            </div>
          ) : !ledger || ledger.length === 0 ? (
            <div
              className="px-4 py-6 text-center text-sm text-emerald-400/60"
              data-testid="status-ledger-empty"
            >
              No activity yet. Win a match to earn points.
            </div>
          ) : (
            <ul className="divide-y divide-emerald-500/10">
              {ledger.slice(0, 10).map((e) => {
                const positive = e.delta > 0;
                return (
                  <li
                    key={e.id}
                    className="flex items-center justify-between px-4 py-2.5 text-sm"
                    data-testid={`row-ledger-${e.id}`}
                  >
                    <div className="min-w-0 mr-3">
                      <div className="font-medium text-emerald-100 truncate">
                        {REASON_LABELS[e.reason] ?? e.reason}
                      </div>
                      <div className="text-[11px] text-emerald-400/60">
                        {e.createdAt ? formatRelativeTime(e.createdAt) : ""}
                      </div>
                    </div>
                    <div
                      className={`font-bold tabular-nums ${positive ? "text-emerald-300" : "text-red-300"
                        }`}
                      data-testid={`text-ledger-delta-${e.id}`}
                    >
                      {positive ? "+" : ""}
                      {e.delta}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
