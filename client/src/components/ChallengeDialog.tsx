import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import type { Player, PoolHall } from '@shared/schema';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Challenge {
  id: string;
  title: string;
  description?: string;
  aPlayerId: string;
  bPlayerId: string;
  hallId: string;
  scheduledAt: string;
  status: string;
}

interface ChallengeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  challenge?: Challenge | null;
  selectedDate?: string;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const challengeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  aPlayerId: z.string().min(1, 'Player A is required'),
  bPlayerId: z.string().min(1, 'Player B is required'),
  hallId: z.string().min(1, 'Pool hall is required'),
  scheduledAt: z.string().min(1, 'Schedule time is required'),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
});

type ChallengeFormData = z.infer<typeof challengeSchema>;

export function ChallengeDialog({
  isOpen,
  onClose,
  challenge,
  selectedDate,
  onSubmit,
  isLoading,
}: ChallengeDialogProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: '',
      description: '',
      aPlayerId: '',
      bPlayerId: '',
      hallId: '',
      scheduledAt: '',
      status: 'scheduled',
    },
  });

  // Set form values when challenge or selectedDate changes
  useEffect(() => {
    if (challenge) {
      setIsEditing(true);
      const scheduledDate = new Date(challenge.scheduledAt);
      const isoString = new Date(scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      
      form.reset({
        title: challenge.title,
        description: challenge.description || '',
        aPlayerId: challenge.aPlayerId,
        bPlayerId: challenge.bPlayerId,
        hallId: challenge.hallId,
        scheduledAt: isoString,
        status: challenge.status as any,
      });
    } else if (selectedDate) {
      setIsEditing(false);
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1, 0, 0, 0);
      
      const dateWithTime = selectedDate.includes('T') 
        ? selectedDate 
        : `${selectedDate}T${defaultTime.toTimeString().slice(0, 5)}`;
      
      form.reset({
        title: '',
        description: '',
        aPlayerId: '',
        bPlayerId: '',
        hallId: '',
        scheduledAt: dateWithTime,
        status: 'scheduled',
      });
    } else {
      setIsEditing(false);
      form.reset({
        title: '',
        description: '',
        aPlayerId: '',
        bPlayerId: '',
        hallId: '',
        scheduledAt: '',
        status: 'scheduled',
      });
    }
  }, [challenge, selectedDate, form]);

  const handleSubmit = (data: ChallengeFormData) => {
    // Convert local datetime to UTC for API
    const scheduledAt = new Date(data.scheduledAt).toISOString();
    onSubmit({ ...data, scheduledAt });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Pull real players + halls from the API. `/api/players` requires auth;
  // `/api/halls` is a public read used by marketing pages too. This dialog
  // is only mounted from authenticated pages (ChallengeCalendar) so both
  // resolve cleanly here.
  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ['/api/players'],
    enabled: isOpen,
  });

  // /api/halls returns { halls, allHalls, battlesEnabled }. `halls` is filtered
  // to battles-unlocked rooms; we want every active hall a match can be
  // scheduled at, so we read from `allHalls`.
  const { data: hallsResponse, isLoading: hallsLoading } = useQuery<{
    halls: PoolHall[];
    allHalls: PoolHall[];
    battlesEnabled: boolean;
  }>({
    queryKey: ['/api/halls'],
    enabled: isOpen,
  });
  const poolHalls = (hallsResponse?.allHalls ?? hallsResponse?.halls ?? []).filter(
    (h) => h.active !== false,
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-green-500/20 text-green-400 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-400">
            <Calendar className="h-5 w-5" />
            {isEditing ? 'Edit Challenge' : 'Create New Challenge'}
            {challenge && (
              <Badge 
                variant="outline" 
                className={`ml-2 ${getStatusBadgeClass(challenge.status)}`}
              >
                {challenge.status}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-400">Challenge Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter challenge title..."
                      className="bg-gray-800 border-green-500/30 text-green-400 placeholder:text-green-400/50"
                      data-testid="input-challenge-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-green-400">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional details about the challenge..."
                      className="bg-gray-800 border-green-500/30 text-green-400 placeholder:text-green-400/50"
                      rows={3}
                      data-testid="input-challenge-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Players */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="aPlayerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-400 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Player A
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      data-testid="select-player-a"
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-800 border-green-500/30 text-green-400">
                          <SelectValue placeholder={playersLoading ? 'Loading players…' : 'Select Player A'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-green-500/30">
                        {!playersLoading && players.length === 0 && (
                          <div
                            className="px-2 py-1.5 text-sm text-green-400/60"
                            data-testid="text-no-players"
                          >
                            No players available
                          </div>
                        )}
                        {players.map((player) => (
                          <SelectItem 
                            key={player.id} 
                            value={player.id}
                            className="text-green-400 focus:bg-green-500/10"
                          >
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bPlayerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-400 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Player B
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      data-testid="select-player-b"
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-800 border-green-500/30 text-green-400">
                          <SelectValue placeholder={playersLoading ? 'Loading players…' : 'Select Player B'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-green-500/30">
                        {(() => {
                          const eligible = players.filter(
                            (p) => p.id !== form.watch('aPlayerId'),
                          );
                          if (!playersLoading && eligible.length === 0) {
                            return (
                              <div
                                className="px-2 py-1.5 text-sm text-green-400/60"
                                data-testid="text-no-opponents"
                              >
                                No eligible opponent
                              </div>
                            );
                          }
                          return null;
                        })()}
                        {players
                          .filter(player => player.id !== form.watch('aPlayerId'))
                          .map((player) => (
                            <SelectItem 
                              key={player.id} 
                              value={player.id}
                              className="text-green-400 focus:bg-green-500/10"
                            >
                              {player.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pool Hall and Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hallId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-400 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Pool Hall
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      data-testid="select-pool-hall"
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-800 border-green-500/30 text-green-400">
                          <SelectValue placeholder={hallsLoading ? 'Loading halls…' : 'Select Pool Hall'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-green-500/30">
                        {!hallsLoading && poolHalls.length === 0 && (
                          <div
                            className="px-2 py-1.5 text-sm text-green-400/60"
                            data-testid="text-no-halls"
                          >
                            No pool halls available
                          </div>
                        )}
                        {poolHalls.map((hall) => (
                          <SelectItem 
                            key={hall.id} 
                            value={hall.id}
                            className="text-green-400 focus:bg-green-500/10"
                          >
                            {hall.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-400 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Schedule Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        className="bg-gray-800 border-green-500/30 text-green-400"
                        data-testid="input-schedule-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status (only for editing) */}
            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-400">Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      data-testid="select-challenge-status"
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-800 border-green-500/30 text-green-400">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-green-500/30">
                        <SelectItem value="scheduled" className="text-green-400 focus:bg-green-500/10">
                          Scheduled
                        </SelectItem>
                        <SelectItem value="in_progress" className="text-green-400 focus:bg-green-500/10">
                          In Progress
                        </SelectItem>
                        <SelectItem value="completed" className="text-green-400 focus:bg-green-500/10">
                          Completed
                        </SelectItem>
                        <SelectItem value="cancelled" className="text-green-400 focus:bg-green-500/10">
                          Cancelled
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                data-testid="button-cancel-challenge"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-black"
                data-testid="button-save-challenge"
              >
                {isLoading ? 'Saving...' : isEditing ? 'Update Challenge' : 'Create Challenge'}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'border-yellow-500 text-yellow-400';
    case 'in_progress':
      return 'border-blue-500 text-blue-400';
    case 'completed':
      return 'border-green-500 text-green-400';
    case 'cancelled':
      return 'border-red-500 text-red-400';
    default:
      return 'border-gray-500 text-gray-400';
  }
}