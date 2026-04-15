import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Mail, Lock, User, Building2, MapPin, Chrome, UserPlus } from "lucide-react";
import { createOperatorSchema, createPlayerSchema } from "@shared/schema";
import { z } from "zod";
import { Link } from "wouter";

type UserType = "operator" | "player";
type OperatorFormData = z.infer<typeof createOperatorSchema>;
type PlayerFormData = z.infer<typeof createPlayerSchema>;

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
  { value: "basic", label: "Basic Membership", description: "$25/month - Reduced fees" },
  { value: "pro", label: "Pro Membership", description: "$60/month - Includes coaching" },
];

export default function Signup() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialRole = urlParams.get("role") === "operator" ? "operator" : "player";
  const [accountType, setAccountType] = useState<UserType>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const operatorForm = useForm<OperatorFormData>({
    resolver: zodResolver(createOperatorSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      hallName: "",
      city: "",
      state: "",
      subscriptionTier: "small",
    },
  });

  const playerForm = useForm<PlayerFormData>({
    resolver: zodResolver(createPlayerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      city: "",
      state: "",
      tier: "rookie",
      membershipTier: "none",
    },
  });

  // Operator signup mutation
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  const operatorSignupMutation = useMutation({
    mutationFn: (data: OperatorFormData) => apiRequest("/api/auth/signup-operator", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: (_data: any, variables: OperatorFormData) => {
      setPendingVerificationEmail(variables.email);
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const playerSignupMutation = useMutation({
    mutationFn: (data: PlayerFormData) => apiRequest("/api/auth/signup-player", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: (_data: any, variables: PlayerFormData) => {
      setPendingVerificationEmail(variables.email);
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const onOperatorSubmit = (data: OperatorFormData) => {
    operatorSignupMutation.mutate(data);
  };

  const onPlayerSubmit = (data: PlayerFormData) => {
    playerSignupMutation.mutate(data);
  };

  // Google signup via Replit Auth
  const handleGoogleSignup = () => {
    window.location.href = "/api/login";
  };

  const resendMutation = useMutation({
    mutationFn: (emailAddr: string) => apiRequest("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email: emailAddr }),
    }),
    onSuccess: () => {
      toast({ title: "Sent!", description: "Check your inbox for a new verification link." });
    },
  });

  if (pendingVerificationEmail) {
    return (
      <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-emerald-400/20 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-emerald-300" data-testid="text-check-email-title">
              Check Your Email
            </CardTitle>
            <p className="text-gray-400 text-sm">
              We've sent a verification link to{" "}
              <span className="text-white font-medium">{pendingVerificationEmail}</span>.
              Click the link in the email to verify your account, then you can log in.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => resendMutation.mutate(pendingVerificationEmail)}
              variant="outline"
              className="w-full border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300"
              disabled={resendMutation.isPending}
              data-testid="button-resend-signup"
            >
              {resendMutation.isPending ? "Sending..." : "Resend Verification Email"}
            </Button>
            <Link href="/login">
              <Button variant="ghost" className="w-full text-gray-400 hover:text-white" data-testid="button-go-login-after-signup">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-emerald-400/20 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-emerald-300">
            Join BilliardsLadder
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Create your account to start competing
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Signup Button */}
          <Button
            onClick={handleGoogleSignup}
            variant="outline"
            className="w-full border-gray-600 hover:bg-gray-800 text-white"
            data-testid="button-google-signup"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-gray-400">Or create account</span>
            </div>
          </div>

          {/* Account Type Selection */}
          <div className="space-y-3">
            <Label className="text-emerald-300">Account Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={accountType === "player" ? "default" : "outline"}
                onClick={() => setAccountType("player")}
                className={`h-auto py-3 px-4 ${
                  accountType === "player"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border-gray-600 hover:bg-gray-800 text-white"
                }`}
                data-testid="button-select-player"
              >
                <User className="h-4 w-4 mb-1" />
                Player
              </Button>
              <Button
                type="button"
                variant={accountType === "operator" ? "default" : "outline"}
                onClick={() => setAccountType("operator")}
                className={`h-auto py-3 px-4 ${
                  accountType === "operator"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border-gray-600 hover:bg-gray-800 text-white"
                }`}
                data-testid="button-select-operator"
              >
                <Building2 className="h-4 w-4 mb-1" />
                Hall Operator
              </Button>
            </div>
          </div>

          {/* Player Signup Form */}
          {accountType === "player" && (
            <Form {...playerForm}>
              <form onSubmit={playerForm.handleSubmit(onPlayerSubmit)} className="space-y-4">
                <FormField
                  control={playerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-300">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="your@email.com"
                            className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={playerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10 bg-gray-900/50 border-gray-600 text-white"
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={playerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-300">Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            placeholder="John Doe"
                            className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                            data-testid="input-name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={playerForm.control}
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
                    control={playerForm.control}
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
                  control={playerForm.control}
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
                  control={playerForm.control}
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
                  disabled={playerSignupMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  data-testid="button-signup-player"
                >
                  {playerSignupMutation.isPending ? (
                    "Creating Account..."
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Player Account
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* Operator Signup Form */}
          {accountType === "operator" && (
            <Form {...operatorForm}>
              <form onSubmit={operatorForm.handleSubmit(onOperatorSubmit)} className="space-y-4">
                <FormField
                  control={operatorForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-300">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="operator@poolhall.com"
                            className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={operatorForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10 bg-gray-900/50 border-gray-600 text-white"
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={operatorForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-300">Your Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            placeholder="John Smith"
                            className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                            data-testid="input-name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={operatorForm.control}
                  name="hallName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-300">Pool Hall Name</FormLabel>
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
                    control={operatorForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-300">City</FormLabel>
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
                    control={operatorForm.control}
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
                  control={operatorForm.control}
                  name="subscriptionTier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-300">Subscription Tier</FormLabel>
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
                  disabled={operatorSignupMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  data-testid="button-signup-operator"
                >
                  {operatorSignupMutation.isPending ? (
                    "Creating Account..."
                  ) : (
                    <>
                      <Building2 className="mr-2 h-4 w-4" />
                      Create Operator Account
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          <div className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300" data-testid="link-login">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}