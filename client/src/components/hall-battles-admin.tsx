import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lock, Unlock, Shield, Clock } from "lucide-react";

interface HallBattlesStatus {
  id: string;
  name: string;
  city: string;
  battlesUnlocked: boolean;
  unlockedBy?: string;
  unlockedAt?: string;
}

export default function HallBattlesAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [unlockedBy, setUnlockedBy] = useState("");

  const { data: statusData, isLoading } = useQuery({
    queryKey: ["/api/admin/halls/battles-status"],
  });

  const unlockMutation = useMutation({
    mutationFn: async ({ hallId, unlockedBy }: { hallId: string; unlockedBy: string }) => {
      return apiRequest("POST", `/api/admin/halls/${hallId}/unlock-battles`, { unlockedBy });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/halls/battles-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/halls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hall-matches"] });
      toast({
        title: "Hall Battles Unlocked",
        description: (data as any).message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unlock hall battles",
        variant: "destructive",
      });
    },
  });

  const lockMutation = useMutation({
    mutationFn: async (hallId: string) => {
      return apiRequest("POST", `/api/admin/halls/${hallId}/lock-battles`, {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/halls/battles-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/halls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hall-matches"] });
      toast({
        title: "Hall Battles Locked",
        description: (data as any).message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to lock hall battles",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-neon-green border-t-transparent rounded-full" />
      </div>
    );
  }

  const halls: HallBattlesStatus[] = (statusData as any)?.halls || [];

  const handleUnlock = (hallId: string) => {
    if (!unlockedBy.trim()) {
      toast({
        title: "Error",
        description: "Please enter who is unlocking the feature",
        variant: "destructive",
      });
      return;
    }
    unlockMutation.mutate({ hallId, unlockedBy: unlockedBy.trim() });
  };

  const handleLock = (hallId: string) => {
    lockMutation.mutate(hallId);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neon-green mb-2">Hall Battles Access Control</h2>
        <p className="text-gray-400">Manage which pool halls have access to inter-venue competitions</p>
      </div>

      <Card className="bg-felt-darker border border-neon-green/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-neon-green" />
            Unlock Settings
          </CardTitle>
          <CardDescription>
            Enter your name/identifier when unlocking hall battles for tracking purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="unlocked-by" className="text-gray-300">Unlocked By</Label>
            <Input
              id="unlocked-by"
              value={unlockedBy}
              onChange={(e) => setUnlockedBy(e.target.value)}
              placeholder="Enter your name or trustee ID"
              className="bg-black/20 border-neon-green/30 text-white"
              data-testid="input-unlocked-by"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {halls.map((hall) => (
          <Card
            key={hall.id}
            className="bg-felt-darker border border-neon-green/30"
            data-testid={`hall-admin-${hall.id}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    hall.battlesUnlocked
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {hall.battlesUnlocked ? (
                      <Unlock className="w-6 h-6" />
                    ) : (
                      <Lock className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{hall.name}</h3>
                    <p className="text-gray-400">{hall.city}</p>
                    {hall.battlesUnlocked && hall.unlockedBy && (
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500">
                          Unlocked by {hall.unlockedBy}
                          {hall.unlockedAt && (
                            <span className="ml-2">
                              on {new Date(hall.unlockedAt).toLocaleDateString()}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge
                    variant={hall.battlesUnlocked ? "default" : "secondary"}
                    className={
                      hall.battlesUnlocked
                        ? "bg-green-600/20 text-green-400"
                        : "bg-red-600/20 text-red-400"
                    }
                  >
                    {hall.battlesUnlocked ? "UNLOCKED" : "LOCKED"}
                  </Badge>
                  {hall.battlesUnlocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLock(hall.id)}
                      disabled={lockMutation.isPending}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                      data-testid={`button-lock-${hall.id}`}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Lock Battles
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnlock(hall.id)}
                      disabled={unlockMutation.isPending || !unlockedBy.trim()}
                      className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                      data-testid={`button-unlock-${hall.id}`}
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Unlock Battles
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <h4 className="text-yellow-400 font-semibold mb-2">⚠️ Important Notes</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Hall battles are locked by default for new pool halls</li>
          <li>• Only trustees and authorized personnel should unlock this feature</li>
          <li>• Unlocking enables inter-venue competitions and rankings</li>
          <li>• All actions are logged with timestamps and responsible party</li>
        </ul>
      </div>
    </div>
  );
}
