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
import { Crown, Building2, Target, Shield, Users, ArrowRight } from "lucide-react";
import { createOperatorSchema, createPlayerSchema } from "@shared/schema";
import { z } from "zod";

type UserType = "operator" | "player";

// Login form schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
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

export default function AuthLanding() {
  const [activeTab, setActiveTab] = useState<UserType>("player");
  const [showLogin, setShowLogin] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const operatorForm = useForm<OperatorFormData>({
    resolver: zodResolver(createOperatorSchema),
  });

  const playerForm = useForm<PlayerFormData>({
    resolver: zodResolver(createPlayerSchema),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: (response: any) => {
      if (response.requires2FA) {
        setRequires2FA(true);
        toast({
          title: "2FA Required",
          description: "Please enter your two-factor authentication code.",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        // Redirect based on role
        window.location.href = "/";
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Operator signup mutation
  const operatorSignupMutation = useMutation({
    mutationFn: (data: OperatorFormData) => apiRequest("/api/auth/signup-operator", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: (data: any) => {
      if (data?.verificationEmailSent === false) {
        toast({
          title: "Account created, email not sent yet",
          description: "Use Resend Verification Email from login to send a fresh link.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Check your email for login instructions.",
        });
      }
      setShowLogin(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Player signup mutation
  const playerSignupMutation = useMutation({
    mutationFn: (data: PlayerFormData) => apiRequest("/api/auth/signup-player", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: (data: any) => {
      if (data?.verificationEmailSent === false) {
        toast({
          title: "Account created, email not sent yet",
          description: "Use Resend Verification Email from login to send a fresh link.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Check your email for login instructions.",
        });
      }
      setShowLogin(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onOperatorSignup = (data: OperatorFormData) => {
    operatorSignupMutation.mutate(data);
  };

  const onPlayerSignup = (data: PlayerFormData) => {
    playerSignupMutation.mutate(data);
  };

  if (showLogin || false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-felt-green/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-neon-green/30 shadow-felt">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center">
              {false ? (
                <>
                  <Crown className="mr-3 text-yellow-400" />
                  Creator / Owner Login
                </>
              ) : (
                <>
                  <Shield className="mr-3 text-neon-green" />
                  Sign In
                </>
              )}
            </CardTitle>
            {true && (
              <Button 
                variant="ghost" 
                onClick={() => setShowLogin(false)}
                className="text-gray-400 hover:text-white"
              >
                ← Back to sign up options
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          className="bg-black/50 border-green-500/30 text-white"
                          placeholder="Enter your email"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          className="bg-black/50 border-green-500/30 text-white"
                          placeholder="Enter your password"
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requires2FA && (
                  <FormField
                    control={loginForm.control}
                    name="twoFactorCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">2FA Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-black/50 border-green-500/30 text-white"
                            placeholder="Enter 6-digit code"
                            data-testid="input-2fa-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full bg-neon-green hover:bg-green-400 text-black font-bold"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-felt-green/10 p-4">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-white mb-4">Action Ladder</h1>
        <p className="text-gray-400 text-lg">"In here, respect is earned in racks, not words"</p>
      </div>

      {/* User Type Selection */}
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Creator/Owner Card */}
          <Card 
            className={`cursor-pointer transition-all bg-black/60 backdrop-blur-sm border shadow-felt ${
              false 
                ? "border-yellow-400 ring-2 ring-yellow-400/50" 
                : "border-yellow-400/30 hover:border-yellow-400/60"
            }`}
            onClick={() => setActiveTab("operator")}
            data-testid="card-operator"
          >
            <CardHeader className="text-center">
              <Crown className="w-12 h-12 mx-auto text-yellow-400 mb-2" />
              <CardTitle className="text-white">Creator / Owner</CardTitle>
              <p className="text-gray-400 text-sm">Platform administrators & trusted staff</p>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Manual account creation only</li>
                <li>• Email + Password login</li>
                <li>• 2FA authentication</li>
                <li>• Global platform oversight</li>
                <li>• Operator management</li>
              </ul>
            </CardContent>
          </Card>

          {/* Operator Card */}
          <Card 
            className={`cursor-pointer transition-all bg-black/60 backdrop-blur-sm border shadow-felt ${
              activeTab === "operator" 
                ? "border-blue-400 ring-2 ring-blue-400/50" 
                : "border-blue-400/30 hover:border-blue-400/60"
            }`}
            onClick={() => setActiveTab("operator")}
            data-testid="card-operator"
          >
            <CardHeader className="text-center">
              <Building2 className="w-12 h-12 mx-auto text-blue-400 mb-2" />
              <CardTitle className="text-white">Pool Hall Operator</CardTitle>
              <p className="text-gray-400 text-sm">Manage your pool hall & players</p>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Public sign-up available</li>
                <li>• Stripe subscription billing</li>
                <li>• Hall management dashboard</li>
                <li>• Player roster control</li>
                <li>• Live streaming tools</li>
              </ul>
            </CardContent>
          </Card>

          {/* Player Card */}
          <Card 
            className={`cursor-pointer transition-all bg-black/60 backdrop-blur-sm border shadow-felt ${
              activeTab === "player" 
                ? "border-neon-green ring-2 ring-neon-green/50" 
                : "border-neon-green/30 hover:border-neon-green/60"
            }`}
            onClick={() => setActiveTab("player")}
            data-testid="card-player"
          >
            <CardHeader className="text-center">
              <Target className="w-12 h-12 mx-auto text-neon-green mb-2" />
              <CardTitle className="text-white">Player</CardTitle>
              <p className="text-gray-400 text-sm">Join the ladder & compete</p>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Join any participating hall</li>
                <li>• Choose your tier & membership</li>
                <li>• Challenge other players</li>
                <li>• Track your progress</li>
                <li>• Earn respect points</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Sign Up Forms */}
        {activeTab === "operator" && (
          <Card className="max-w-2xl mx-auto bg-black/60 backdrop-blur-sm border border-blue-400/30 shadow-felt">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center">
                <Building2 className="mr-3 text-blue-400" />
                Become an Operator
              </CardTitle>
              <p className="text-gray-400">Set up your pool hall on Action Ladder</p>
            </CardHeader>
            <CardContent>
              <Form {...operatorForm}>
                <form onSubmit={operatorForm.handleSubmit(onOperatorSignup)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={operatorForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Your Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-black/50 border-green-500/30 text-white" data-testid="input-operator-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={operatorForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" className="bg-black/50 border-green-500/30 text-white" data-testid="input-operator-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={operatorForm.control}
                    name="hallName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Pool Hall Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-black/50 border-green-500/30 text-white" data-testid="input-hall-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={operatorForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">City</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-black/50 border-green-500/30 text-white" data-testid="input-city" />
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
                          <FormLabel className="text-gray-300">State</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-black/50 border-green-500/30 text-white" data-testid="input-state" />
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
                        <FormLabel className="text-gray-300">Subscription Tier</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/50 border-green-500/30 text-white" data-testid="select-subscription-tier">
                              <SelectValue placeholder="Choose your hall size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[100]">
                            {subscriptionTiers.map((tier) => (
                              <SelectItem key={tier.value} value={tier.value}>
                                {tier.label} - {tier.description}
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    disabled={operatorSignupMutation.isPending}
                    data-testid="button-operator-signup"
                  >
                    {operatorSignupMutation.isPending ? "Creating Account..." : "Sign Up & Setup Billing"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {activeTab === "player" && (
          <Card className="max-w-2xl mx-auto bg-black/60 backdrop-blur-sm border border-neon-green/30 shadow-felt">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center">
                <Target className="mr-3 text-neon-green" />
                Join the Ladder
              </CardTitle>
              <p className="text-gray-400">Create your player account and start competing</p>
            </CardHeader>
            <CardContent>
              <Form {...playerForm}>
                <form onSubmit={playerForm.handleSubmit(onPlayerSignup)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={playerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-black/50 border-green-500/30 text-white" data-testid="input-player-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                  </div>

                  <FormField
                    control={playerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" className="bg-black/50 border-green-500/30 text-white" data-testid="input-player-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={playerForm.control}
                    name="tier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Division</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/50 border-green-500/30 text-white" data-testid="select-player-tier">
                              <SelectValue placeholder="Choose your starting division" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[100]">
                            {playerTiers.map((tier) => (
                              <SelectItem key={tier.value} value={tier.value}>
                                {tier.label} - {tier.description}
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
                        <FormLabel className="text-gray-300">Membership</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/50 border-green-500/30 text-white" data-testid="select-membership-tier">
                              <SelectValue placeholder="Choose membership level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[100]">
                            {membershipTiers.map((tier) => (
                              <SelectItem key={tier.value} value={tier.value}>
                                {tier.label} - {tier.description}
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
                    className="w-full bg-neon-green hover:bg-green-400 text-black font-bold"
                    disabled={playerSignupMutation.isPending}
                    data-testid="button-player-signup"
                  >
                    {playerSignupMutation.isPending ? "Creating Account..." : "Join the Ladder"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Already have an account link */}
        {true && (
          <div className="text-center mt-8">
            <Button 
              variant="ghost" 
              onClick={() => setShowLogin(true)}
              className="text-gray-400 hover:text-white"
              data-testid="button-show-login"
            >
              Already have an account? Sign in
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}