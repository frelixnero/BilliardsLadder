import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Mail, Lock, LogIn, Chrome, MailCheck, RefreshCw, ShieldAlert, Send, ArrowLeft, CheckCircle } from "lucide-react";
import { z } from "zod";
import { Link } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface BanInfo {
  userId: string;
  email: string;
  name?: string;
  reason: string;
  type: "banned" | "suspended";
  expiresAt?: string;
  appealToken: string;
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealSubmitted, setAppealSubmitted] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [appealContext, setAppealContext] = useState("");
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      twoFactorCode: "",
    },
  });

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
        const user = response.user;
        toast({
          title: "Welcome Back!",
          description: "Login successful.",
        });
        
        if (user?.globalRole === "OWNER") {
          window.location.href = "/app?tab=admin";
        } else if (user?.globalRole === "TRUSTEE") {
          window.location.href = "/app?tab=admin";
        } else if (user?.globalRole === "OPERATOR") {
          window.location.href = "/app?tab=dashboard";
        } else {
          window.location.href = "/app?tab=dashboard";
        }
      }
    },
    onError: (error: any) => {
      const errMsg = error?.message || "";
      try {
        const jsonPart = errMsg.substring(errMsg.indexOf("{"));
        const parsed = JSON.parse(jsonPart);
        if (parsed.emailNotVerified) {
          setUnverifiedEmail(parsed.email || form.getValues("email"));
          return;
        }
        if (parsed.accountBanned) {
          setBanInfo({
            userId: parsed.userId || "",
            email: form.getValues("email"),
            reason: parsed.banReason || "No reason provided.",
            type: "banned",
            appealToken: parsed.appealToken || "",
          });
          return;
        }
        if (parsed.accountSuspended) {
          setBanInfo({
            userId: parsed.userId || "",
            email: form.getValues("email"),
            reason: parsed.banReason || "No reason provided.",
            type: "suspended",
            expiresAt: parsed.banExpiresAt,
            appealToken: parsed.appealToken || "",
          });
          return;
        }
      } catch {}
      if (errMsg.includes("verify your email")) {
        setUnverifiedEmail(form.getValues("email"));
        return;
      }
      if (errMsg.includes("banned")) {
        setBanInfo({
          userId: "",
          email: form.getValues("email"),
          reason: "Your account has been banned.",
          type: "banned",
          appealToken: "",
        });
        return;
      }
      if (errMsg.includes("suspended")) {
        setBanInfo({
          userId: "",
          email: form.getValues("email"),
          reason: "Your account is suspended.",
          type: "suspended",
          appealToken: "",
        });
        return;
      }
      toast({
        title: "Login Failed",
        description: errMsg.includes(":") ? errMsg.split(": ").slice(1).join(": ") : errMsg || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const appealMutation = useMutation({
    mutationFn: (data: { appealToken: string; reason: string; supportingContext?: string }) =>
      apiRequest("/api/appeals", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setAppealSubmitted(true);
      toast({
        title: "Appeal Submitted",
        description: "Your appeal has been submitted and will be reviewed by an admin.",
      });
    },
    onError: (error: any) => {
      const errMsg = error?.message || "";
      let description = "Failed to submit appeal. Please try again.";
      try {
        const jsonPart = errMsg.substring(errMsg.indexOf("{"));
        const parsed = JSON.parse(jsonPart);
        if (parsed.error) {
          description = parsed.error;
        }
      } catch {}
      toast({
        title: "Appeal Failed",
        description,
        variant: "destructive",
      });
    },
  });

  const handleAppealSubmit = () => {
    if (!banInfo || !appealReason.trim() || !banInfo.appealToken) return;
    appealMutation.mutate({
      appealToken: banInfo.appealToken,
      reason: appealReason,
      supportingContext: appealContext || undefined,
    });
  };

  const resendMutation = useMutation({
    mutationFn: (email: string) => apiRequest("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
    onSuccess: () => {
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Resend",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const handleGoogleLogin = () => {
    window.location.href = "/api/login";
  };

  if (banInfo && appealSubmitted) {
    return (
      <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-emerald-400/20 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-300" data-testid="text-appeal-submitted-title">
              Appeal Submitted
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Your appeal has been submitted successfully. An admin will review it and you will be notified by email at <span className="text-white font-medium">{banInfo.email}</span>.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-black/40 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-xs mb-1">Your appeal reason:</p>
              <p className="text-gray-300 text-sm">{appealReason}</p>
            </div>
            <Button
              onClick={() => {
                setBanInfo(null);
                setShowAppealForm(false);
                setAppealSubmitted(false);
                setAppealReason("");
                setAppealContext("");
              }}
              variant="ghost"
              className="w-full text-gray-400 hover:text-white"
              data-testid="button-back-to-login-from-appeal"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (banInfo && showAppealForm) {
    return (
      <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-emerald-400/20 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Send className="h-8 w-8 text-amber-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-amber-300" data-testid="text-appeal-form-title">
              Submit Appeal
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Explain why you believe your {banInfo.type === "banned" ? "ban" : "suspension"} should be reversed.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Reason for Appeal *</label>
              <Textarea
                placeholder="Explain why you believe this action was unjustified or provide context..."
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                className="bg-gray-900/50 border-gray-600 text-white min-h-[120px]"
                data-testid="input-appeal-reason"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Supporting Context (optional)</label>
              <Textarea
                placeholder="Any additional details, evidence, or context that supports your appeal..."
                value={appealContext}
                onChange={(e) => setAppealContext(e.target.value)}
                className="bg-gray-900/50 border-gray-600 text-white min-h-[80px]"
                data-testid="input-appeal-context"
              />
            </div>
            <Button
              onClick={handleAppealSubmit}
              disabled={!appealReason.trim() || appealMutation.isPending}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              data-testid="button-submit-appeal"
            >
              {appealMutation.isPending ? "Submitting..." : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Appeal
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowAppealForm(false)}
              variant="ghost"
              className="w-full text-gray-400 hover:text-white"
              data-testid="button-back-to-ban-notice"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (banInfo) {
    const isBanned = banInfo.type === "banned";
    return (
      <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-red-500/20 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-300" data-testid="text-ban-title">
              Account {isBanned ? "Banned" : "Suspended"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30">
              <p className="text-red-400 text-sm font-medium mb-1">Reason:</p>
              <p className="text-gray-300 text-sm" data-testid="text-ban-reason">{banInfo.reason}</p>
            </div>
            {banInfo.expiresAt && (
              <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                <p className="text-yellow-400 text-sm" data-testid="text-ban-expires">
                  Suspension expires: {new Date(banInfo.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            )}
            <Button
              onClick={() => setShowAppealForm(true)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              disabled={!banInfo.appealToken}
              data-testid="button-appeal"
            >
              <Send className="mr-2 h-4 w-4" />
              Appeal This Decision
            </Button>
            <Button
              onClick={() => {
                setBanInfo(null);
                setShowAppealForm(false);
              }}
              variant="ghost"
              className="w-full text-gray-400 hover:text-white"
              data-testid="button-back-to-login-from-ban"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (unverifiedEmail) {
    return (
      <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-emerald-400/20 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <MailCheck className="h-8 w-8 text-amber-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-amber-300" data-testid="text-verify-title">
              Email Verification Required
            </CardTitle>
            <p className="text-gray-400 text-sm">
              We sent a verification link to <span className="text-white font-medium">{unverifiedEmail}</span>.
              Please check your inbox and click the link to verify your email before logging in.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => resendMutation.mutate(unverifiedEmail)}
              variant="outline"
              className="w-full border-amber-500/30 hover:bg-amber-500/10 text-amber-300"
              disabled={resendMutation.isPending}
              data-testid="button-resend-verification"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${resendMutation.isPending ? "animate-spin" : ""}`} />
              {resendMutation.isPending ? "Sending..." : "Resend Verification Email"}
            </Button>
            <Button
              onClick={() => setUnverifiedEmail(null)}
              variant="ghost"
              className="w-full text-gray-400 hover:text-white"
              data-testid="button-back-to-login"
            >
              Back to Login
            </Button>
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
            Welcome Back
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Sign in to your BilliardsLadder account
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full border-gray-600 hover:bg-gray-800 text-white"
            data-testid="button-google-login"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-gray-400">Or continue with email</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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

              {requires2FA && (
                <FormField
                  control={form.control}
                  name="twoFactorCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-300">Two-Factor Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="000000"
                          className="bg-gray-900/50 border-gray-600 text-white text-center tracking-widest"
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  "Signing in..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center space-y-2">
            <Link href="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300" data-testid="link-forgot-password">
              Forgot your password?
            </Link>
            <div className="text-sm text-gray-400">
              Don't have an account?{" "}
              <Link href="/signup" className="text-emerald-400 hover:text-emerald-300" data-testid="link-signup">
                Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
