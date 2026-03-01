import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Mail, Lock, Crown } from "lucide-react";
import { z } from "zod";
import { Link } from "wouter";

const ownerLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional(),
});

type OwnerLoginFormData = z.infer<typeof ownerLoginSchema>;

export default function OwnerLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const { toast } = useToast();

  const form = useForm<OwnerLoginFormData>({
    resolver: zodResolver(ownerLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      twoFactorCode: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: OwnerLoginFormData) => apiRequest("/api/auth/login", {
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
        const user = response.user;
        if (user?.globalRole !== "OWNER") {
          toast({
            title: "Access Denied",
            description: "This login is for Owner/Founder accounts only.",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Welcome Back, Founder!",
          description: "Login successful.",
        });
        
        window.location.href = "/owner-dashboard";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OwnerLoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-amber-400/30 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-2">
            <Crown className="h-8 w-8 text-amber-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-amber-300">
            Owner/Founder Login
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Access your founder dashboard
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-amber-300">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="founder@actionladder.com"
                          className="pl-10 bg-gray-900/50 border-gray-600 text-white focus:border-amber-400"
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-amber-300">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10 bg-gray-900/50 border-gray-600 text-white focus:border-amber-400"
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

              {requires2FA && (
                <FormField
                  control={form.control}
                  name="twoFactorCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-300">Two-Factor Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="000000"
                          className="bg-gray-900/50 border-gray-600 text-white text-center tracking-widest focus:border-amber-400"
                          maxLength={6}
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
                disabled={loginMutation.isPending}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In as Owner"}
              </Button>
            </form>
          </Form>

          <div className="text-center space-y-2">
            <Link href="/forgot-password" className="text-sm text-amber-400 hover:text-amber-300 hover:underline" data-testid="link-forgot-password">
              Forgot Password?
            </Link>
            <div className="pt-2">
              <Link href="/login" className="text-sm text-gray-400 hover:text-white hover:underline" data-testid="link-general-login">
                Back to General Login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
