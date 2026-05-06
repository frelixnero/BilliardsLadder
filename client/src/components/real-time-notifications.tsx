import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Trophy, Target, Crown, AlertTriangle } from "lucide-react";

interface AuthMe {
  id?: string;
  user?: { id?: string };
  claims?: { sub?: string };
}

interface NotificationApiItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  urgent: boolean;
  actionUrl: string | null;
  refType: string | null;
  refId: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  items: NotificationApiItem[];
  unreadCount: number;
}

function notificationsKey(userId: string | null) {
  return ["/api/me/notifications", userId ?? "anon"] as const;
}

function iconForType(type: string) {
  switch (type) {
    case "challenge":
      return <Target className="w-4 h-4 text-orange-400" />;
    case "match_result":
      return <Trophy className="w-4 h-4 text-green-400" />;
    case "tournament":
    case "rookie_graduation":
      return <Crown className="w-4 h-4 text-purple-400" />;
    case "ban":
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    default:
      return <Bell className="w-4 h-4 text-blue-400" />;
  }
}

function typeBorder(type: string, urgent: boolean) {
  const base = (() => {
    switch (type) {
      case "challenge":
        return "border-orange-500/30 bg-orange-900/20";
      case "match_result":
        return "border-green-500/30 bg-green-900/20";
      case "tournament":
        return "border-purple-500/30 bg-purple-900/20";
      case "ladder_change":
        return "border-blue-500/30 bg-blue-900/20";
      case "rookie_graduation":
        return "border-yellow-500/30 bg-yellow-900/20";
      case "hall_battle":
        return "border-cyan-500/30 bg-cyan-900/20";
      case "ban":
        return "border-red-500/30 bg-red-900/20";
      default:
        return "border-gray-500/30 bg-gray-900/20";
    }
  })();
  return urgent ? `${base} ring-2 ring-red-500/50` : base;
}

function NotificationCard({
  notification,
  onDismiss,
  onMarkRead,
}: {
  notification: NotificationApiItem;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}) {
  const ts = new Date(notification.createdAt);
  return (
    <Card
      className={typeBorder(notification.type, notification.urgent)}
      data-testid={`card-notification-${notification.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="mt-1">{iconForType(notification.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">
                {notification.title}
              </h4>
              <div className="flex items-center space-x-2">
                {notification.urgent && (
                  <Badge className="bg-red-600/20 text-red-400 border-red-500/30 text-xs">
                    Urgent
                  </Badge>
                )}
                {!notification.readAt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkRead(notification.id)}
                    className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                    data-testid={`button-mark-read-${notification.id}`}
                  >
                    Mark read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(notification.id)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  data-testid={`button-dismiss-${notification.id}`}
                >
                  ×
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              {ts.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RealTimeNotifications() {
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();
  const seenUrgentIds = useRef<Set<string>>(new Set());
  const lastUserIdRef = useRef<string | null>(null);

  // Resolve current user id so the notifications cache is scoped per-user.
  // Without this, a logout/login transition could briefly show the previous
  // user's cached notifications.
  const { data: me } = useQuery<AuthMe | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`${res.status}`);
      return (await res.json()) as AuthMe;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const currentUserId =
    me?.id ?? me?.user?.id ?? me?.claims?.sub ?? null;

  // Reset toast de-duping when the authenticated user changes — otherwise
  // the new user could miss urgent toasts whose ids happen to collide.
  useEffect(() => {
    if (lastUserIdRef.current !== currentUserId) {
      seenUrgentIds.current = new Set();
      lastUserIdRef.current = currentUserId;
    }
  }, [currentUserId]);

  // Poll every 30s. Wrap our own queryFn to silently return null when not
  // authenticated so the bell can stay mounted on public pages without
  // flashing errors.
  const { data } = useQuery<NotificationsResponse | null>({
    queryKey: notificationsKey(currentUserId),
    enabled: currentUserId !== null,
    queryFn: async () => {
      const res = await fetch("/api/me/notifications?limit=20", {
        credentials: "include",
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`${res.status}`);
      return (await res.json()) as NotificationsResponse;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const urgentCount = items.filter((n) => n.urgent && !n.readAt).length;

  // Toast newly-arrived urgent notifications exactly once per id.
  useEffect(() => {
    for (const n of items) {
      if (n.urgent && !n.readAt && !seenUrgentIds.current.has(n.id)) {
        seenUrgentIds.current.add(n.id);
        toast({
          title: n.title,
          description: n.message,
          duration: 5000,
        });
      }
    }
  }, [items, toast]);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: notificationsKey(currentUserId),
    });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/me/notifications/${id}/read`, { method: "POST" }),
    onSuccess: invalidate,
  });

  const dismiss = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/me/notifications/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  const clearAll = useMutation({
    mutationFn: () =>
      apiRequest(`/api/me/notifications/read-all`, { method: "POST" }),
    onSuccess: invalidate,
  });

  // Hide the bell entirely when the user isn't logged in.
  if (currentUserId === null) return null;

  return (
    <div className="fixed top-4 right-4 z-50" data-testid="notification-center">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="relative bg-black/80 backdrop-blur-sm border-green-500/30 hover:bg-green-900/20"
        data-testid="notification-bell"
      >
        <Bell className="w-4 h-4 text-green-400" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-600 text-white text-xs"
            data-testid="badge-unread-count"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isVisible && (
        <div className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto bg-black/95 backdrop-blur-md border border-green-500/30 rounded-lg shadow-2xl">
          <div className="p-4 border-b border-green-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              <div className="flex items-center space-x-2">
                {urgentCount > 0 && (
                  <Badge className="bg-red-600/20 text-red-400 border-red-500/30">
                    {urgentCount} urgent
                  </Badge>
                )}
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearAll.mutate()}
                    disabled={clearAll.isPending}
                    className="text-xs text-gray-400 hover:text-white"
                    data-testid="button-mark-all-read"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="p-2 space-y-2">
            {items.length === 0 ? (
              <div
                className="text-center py-8 text-gray-400"
                data-testid="text-empty-notifications"
              >
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No new notifications</p>
              </div>
            ) : (
              items.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onDismiss={(id) => dismiss.mutate(id)}
                  onMarkRead={(id) => markRead.mutate(id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
