import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Building2, MapPin, UserPlus } from "lucide-react";
import { z } from "zod";

type RoleType = "player" | "operator";

const playerSchema = z.object({
  role: z.literal("player"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  tier: z.string().min(1, "Skill level is required"),
  membershipTier: z.string().min(1, "Membership tier is required"),
});

const operatorSchema = z.object({
  role: z.literal("operator"),
  hallName: z.string().min(1, "Hall name is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  subscriptionTier: z.string().min(1, "Subscription tier is required"),
});

const roleSchema = z.discriminatedUnion("role", [playerSchema, operatorSchema]);

type RoleFormData = z.infer<typeof roleSchema>;

const subscriptionTiers = [
  { value: "small", label: "Small Hall", description: "Up to 25 players - $199/mo" },
  { value: "medium", label: "Medium Hall", description: "Up to 50 players - $349/mo" },
  { value: "large", label: "Large Hall", description: "Up to 100 players - $599/mo" },
  { value: "mega", label: "Mega Hall", description: "Unlimited players - $999/mo" },
];

const playerTiers = [
  { value: "rookie", label: "Rookie Division", description: "New players under Fargo 500" },
  { value: "barbox", label: "Barbox (7ft tables)", description: "Beginner-friendly smaller tables" },
  { value: "eight_foot", label: "8-Foot Division", description: "Standard competition tables" },
  { value: "nine_foot", label: "9-Foot Division", description: "Professional tournament tables" },
];

const membershipTiers = [
  { value: "none", label: "No Membership", description: "Pay per game" },
  { value: "basic", label: "Standard Membership", description: "$24.99/month - Reduced fees" },
  { value: "pro", label: "Elite Membership", description: "$74.99/month - Includes coaching" },
];

export default function SelectRole() {
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const { toast } = useToast();

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: "player",
      city: "",
      state: "",
    } as any,
  });

  const roleAssignMutation = useMutation({
    mutationFn: (data: RoleFormData) => apiRequest("/api/auth/assign-role", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "Role Assigned!",
        description: "Your account has been set up successfully.",
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RoleFormData) => {
    roleAssignMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-emerald-400/20 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-emerald-300">
            Choose Your Role
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Select how you'll be using ActionLadder
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Selection */}
          {!selectedRole && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedRole("player");
                    form.setValue("role", "player");
                  }}
                  className="h-auto py-6 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-left flex items-start gap-3"
                  data-testid="button-select-player"
                >
                  <User className="h-6 w-6 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-lg">I'm a Player</div>
                    <div className="text-sm text-emerald-100">
                      Compete in ladders, tournaments, and challenges
                    </div>
                  </div>
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedRole("operator");
                    form.setValue("role", "operator");
                  }}
                  className="h-auto py-6 px-4 bg-blue-600 hover:bg-blue-700 text-white text-left flex items-start gap-3"
                  data-testid="button-select-operator"
                >
                  <Building2 className="h-6 w-6 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-lg">I'm a Pool Hall Operator</div>
                    <div className="text-sm text-blue-100">
                      Manage your pool hall and organize events
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Player Form */}
          {selectedRole === "player" && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-emerald-300 font-semibold">Player Information</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRole(null)}
                    className="text-gray-400 hover:text-white"
                    data-testid="button-back"
                  >
                    ← Back
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-300">City</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Austin"
                            className="bg-gray-900/50 border-gray-600 text-white"
                            data-testid="input-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-300">State</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="TX"
                            className="bg-gray-900/50 border-gray-600 text-white"
                            data-testid="input-state"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-300">Skill Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white" data-testid="select-skill-level">
                            <SelectValue placeholder="Select your skill level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {playerTiers.map((tier) => (
                            <SelectItem key={tier.value} value={tier.value}>
                              <div>
                                <div className="font-medium">{tier.label}</div>
                                <div className="text-sm text-gray-500">{tier.description}</div>
                              </div>
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
                  name="membershipTier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-300">Membership</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white" data-testid="select-membership">
                            <SelectValue placeholder="Select membership tier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {membershipTiers.map((tier) => (
                            <SelectItem key={tier.value} value={tier.value}>
                              <div>
                                <div className="font-medium">{tier.label}</div>
                                <div className="text-sm text-gray-500">{tier.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={roleAssignMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  data-testid="button-complete-player"
                >
                  {roleAssignMutation.isPending ? (
                    "Setting up..."
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Complete Player Setup
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* Operator Form */}
          {selectedRole === "operator" && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-blue-300 font-semibold">Operator Information</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRole(null)}
                    className="text-gray-400 hover:text-white"
                    data-testid="button-back"
                  >
                    ← Back
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="hallName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-300">Pool Hall Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            placeholder="8-Ball Palace"
                            className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                            data-testid="input-hall-name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-300">City</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Dallas"
                            className="bg-gray-900/50 border-gray-600 text-white"
                            data-testid="input-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-300">State</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="TX"
                            className="bg-gray-900/50 border-gray-600 text-white"
                            data-testid="input-state"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subscriptionTier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-300">Subscription Tier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white" data-testid="select-subscription-tier">
                            <SelectValue placeholder="Select your tier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subscriptionTiers.map((tier) => (
                            <SelectItem key={tier.value} value={tier.value}>
                              <div>
                                <div className="font-medium">{tier.label}</div>
                                <div className="text-sm text-gray-500">{tier.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={roleAssignMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-complete-operator"
                >
                  {roleAssignMutation.isPending ? (
                    "Setting up..."
                  ) : (
                    <>
                      <Building2 className="mr-2 h-4 w-4" />
                      Complete Operator Setup
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
