import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Zap, Clock, Users, DollarSign, Target, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Player } from '@shared/schema';

const quickChallengeSchema = z.object({
  opponentId: z.string().min(1, 'Please select an opponent'),
  gameType: z.string().default('8-ball'),
  stakes: z.string().default('60'),
  timeSlot: z.string().min(1, 'Please select a time slot'),
  hallId: z.string().default('hall1'),
});

type QuickChallengeFormData = z.infer<typeof quickChallengeSchema>;

interface QuickChallengeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickChallengeDialog({ isOpen, onClose }: QuickChallengeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ['/api/players'],
    enabled: isOpen,
  });

  const form = useForm<QuickChallengeFormData>({
    resolver: zodResolver(quickChallengeSchema),
    defaultValues: {
      opponentId: '',
      gameType: '8-ball',
      stakes: '60',
      timeSlot: '',
      hallId: 'hall1',
    },
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (data: QuickChallengeFormData) => {
      // Identity (aPlayerId / aPlayerName) is derived from the authenticated
      // session on the server — never trust the client for that.
      return apiRequest('/api/quick-challenge', {
        method: 'POST',
        body: JSON.stringify({
          opponentId: data.opponentId,
          gameType: data.gameType,
          stakes: parseInt(data.stakes),
          timeSlot: data.timeSlot,
          hallId: data.hallId,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Quick Challenge Sent!",
        description: "Your challenge has been sent and will appear in the opponent's inbox.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/player/challenges'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Challenge Failed",
        description: error.message || "Unable to create challenge. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: QuickChallengeFormData) => {
    setIsSubmitting(true);
    try {
      await createChallengeMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Available players for quick challenge.
  // The server enforces "no self-challenge"; we just filter for active players here.
  const availablePlayers = players
    .filter((player: Player) => player.rating >= 400)
    .slice(0, 8);

  // Quick time slots for today/tomorrow
  const timeSlots = [
    { value: '18:00', label: '6:00 PM' },
    { value: '18:30', label: '6:30 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '19:30', label: '7:30 PM' },
    { value: '20:00', label: '8:00 PM' },
    { value: '20:30', label: '8:30 PM' },
    { value: '21:00', label: '9:00 PM' },
    { value: '21:30', label: '9:30 PM' },
  ];

  const gameTypes = [
    { value: '8-ball', label: '8-Ball' },
    { value: '9-ball', label: '9-Ball' },
    { value: '10-ball', label: '10-Ball' },
  ];

  const stakesOptions = [
    { value: '40', label: '$40' },
    { value: '60', label: '$60 (Standard)' },
    { value: '80', label: '$80' },
    { value: '100', label: '$100' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-red-500/30 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <Zap className="h-5 w-5" />
            Quick Challenge
            <Badge variant="outline" className="ml-2 border-red-500/50 text-red-400">
              Fast Setup
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Opponent Selection */}
            <FormField
              control={form.control}
              name="opponentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-red-400 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Choose Your Opponent
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-gray-800 border-red-500/30 text-white">
                        <SelectValue placeholder="Select opponent..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-red-500/30">
                        {availablePlayers.map((player: Player) => (
                          <SelectItem 
                            key={player.id} 
                            value={player.id}
                            className="text-white hover:bg-gray-700"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{player.name}</span>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>Rating: {player.rating}</span>
                                <span>•</span>
                                <span>{player.city}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quick Settings Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Game Type */}
              <FormField
                control={form.control}
                name="gameType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-red-400 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Game
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="bg-gray-800 border-red-500/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-red-500/30">
                          {gameTypes.map((game) => (
                            <SelectItem 
                              key={game.value} 
                              value={game.value}
                              className="text-white hover:bg-gray-700"
                            >
                              {game.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stakes */}
              <FormField
                control={form.control}
                name="stakes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-red-400 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Stakes
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="bg-gray-800 border-red-500/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-red-500/30">
                          {stakesOptions.map((stake) => (
                            <SelectItem 
                              key={stake.value} 
                              value={stake.value}
                              className="text-white hover:bg-gray-700"
                            >
                              {stake.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Time Slot */}
            <FormField
              control={form.control}
              name="timeSlot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-red-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Preferred Time
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-gray-800 border-red-500/30 text-white">
                        <SelectValue placeholder="Choose time..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-red-500/30">
                        {timeSlots.map((slot) => (
                          <SelectItem 
                            key={slot.value} 
                            value={slot.value}
                            className="text-white hover:bg-gray-700"
                          >
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Info Box */}
            <div className="bg-red-900/20 border border-red-600/30 rounded p-4">
              <div className="flex items-center gap-2 text-red-300 font-semibold mb-2">
                <MapPin className="h-4 w-4" />
                Quick Challenge Info
              </div>
              <div className="text-sm text-red-200 space-y-1">
                <div>• Auto-approved for immediate play</div>
                <div>• Standard 90-minute time limit</div>
                <div>• Race to 7 format (8-Ball/9-Ball)</div>
                <div>• Played at the selected pool hall</div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                data-testid="button-cancel-quick-challenge"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createChallengeMutation.isPending}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold"
                data-testid="button-submit-quick-challenge"
              >
                {isSubmitting || createChallengeMutation.isPending ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Sending...</span>
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Send Challenge
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}