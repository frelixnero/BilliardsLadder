import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Mail, Lock, LogIn, Chrome, MailCheck, RefreshCw, ShieldBan, ShieldAlert, Clock, CheckCircle2, XCircle, Send, ArrowLeft, MessageSquare } from "lucide-react";
import { z } from "zod";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const appealSchema = z.object({
  reason: z.string().min(20, "Please provide at least 20 characters explaining your appeal."),
});

type AppealFormData = z.infer<typeof appealSchema>;

interface BanInfo {
  userId: string;
  email: string;
  name?: string;
  reason: string;
  type: "banned" | "suspended";
  expiresAt?: string;
  appealToken: string;
}

interface BanAppeal {
  id: string;
  email: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

function BanNotificationScreen({
  banInfo,
  onBack,
}: {
  banInfo: BanInfo;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [showAppealForm, setShowAppealForm] = useState(false);
  const isBanned = banInfo.type === "banned";

  const appealForm = useForm<AppealFormData>({
    resolver: zodResolver(appealSchema),
    defaultValues: { reason: "" },
  });

  const { data: appealData, isLoading: appealLoading, refetch: refetchAppeal } = useQuery<{ appeal: BanAppeal | null }>({
    queryKey: ["/api/ban-appeals/status", banInfo.email],
    queryFn: () =>
      fetch(`/api/ban-appeals/status?email=${encodeURIComponent(banInfo.email)}`).then(
        (r) => r.json()
      ),
    enabled: !!banInfo.email,
  });

  const submitAppealMutation = useMutation({
    mutationFn: (data: AppealFormData) =>
      apiRequest("/api/ban-appeals", {
        method: "POST",
        body: JSON.stringify({ email: banInfo.email, reason: data.reason }),
      }),
    onSuccess: () => {
      toast({
        title: "Appeal Submitted",
        description: "Your appeal has been submitted and will be reviewed by an administrator.",
      });
      setShowAppealForm(false);
      appealForm.reset();
      refetchAppeal();
    },
    onError: (error: any) => {
      const errMsg = error?.message || "Failed to submit appeal.";
      toast({
        title: "Appeal Failed",
        description: errMsg.includes(":") ? errMsg.split(": ").slice(1).join(": ") : errMsg,
        variant: "destructive",
      });
    },
  });

  const appeal = appealData?.appeal;
  const canSubmitNewAppeal = !appeal || appeal.status === "denied";

  const statusConfig = {
    pending: {
      icon: <Clock className="h-5 w-5 text-amber-400" />,
      badge: <Badge className="bg-amber-900/60 text-amber-300 border-amber-500/30" data-testid="badge-appeal-status">Pending Review</Badge>,
      color: "amber",
    },
    approved: {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
      badge: <Badge className="bg-emerald-900/60 text-emerald-300 border-emerald-500/30" data-testid="badge-appeal-status">Approved</Badge>,
      color: "emerald",
    },
    denied: {
      icon: <XCircle className="h-5 w-5 text-red-400" />,
      badge: <Badge className="bg-red-900/60 text-red-300 border-red-500/30" data-testid="badge-appeal-status">Denied</Badge>,
      color: "red",
    },
  };

  return (
    <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-red-400/20 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            {isBanned ? (
              <ShieldBan className="h-8 w-8 text-red-400" />
            ) : (
              <ShieldAlert className="h-8 w-8 text-amber-400" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-red-300" data-testid="text-ban-title">
            Account {isBanned ? "Banned" : "Suspended"}
          </CardTitle>
          <p className="text-gray-400 text-sm" data-testid="text-ban-reason">
            <span className="text-gray-500">Reason:</span> {banInfo.reason}
          </p>
          {!isBanned && banInfo.expiresAt && (
            <p className="text-amber-400 text-xs" data-testid="text-suspension-expires">
              Suspension expires: {new Date(banInfo.expiresAt).toLocaleDateString()}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {appealLoading ? (
            <div className="flex items-center justify-center py-6" data-testid="loading-appeal-status">
              <RefreshCw className="h-5 w-5 text-gray-400 animate-spin mr-2" />
              <span className="text-gray-400 text-sm">Checking appeal status...</span>
            </div>
          ) : appeal ? (
            <div className="space-y-4">
              <div className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-4 space-y-3" data-testid="container-appeal-status">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm font-medium">Appeal Status</span>
                  {statusConfig[appeal.status].badge}
                </div>

                <div className="text-gray-400 text-xs">
                  Submitted: {new Date(appeal.createdAt).toLocaleDateString()}
                </div>

                <div className="text-gray-300 text-sm border-t border-gray-700/50 pt-3">
                  <span className="text-gray-500 text-xs block mb-1">Your appeal:</span>
                  {appeal.reason}
                </div>

                {appeal.adminResponse && (
                  <div className="bg-gray-800/60 rounded-md p-3 border border-gray-600/30" data-testid="text-admin-response">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-blue-300 text-xs font-medium">Admin Response</span>
                    </div>
                    <p className="text-gray-300 text-sm">{appeal.adminResponse}</p>
                  </div>
                )}

                {appeal.status === "approved" && (
                  <p className="text-emerald-400 text-sm text-center pt-2" data-testid="text-appeal-approved-message">
                    Your ban is being reviewed. You may be able to log in again soon.
                  </p>
                )}
              </div>

              {appeal.status === "denied" && (
                <div className="space-y-2">
                  <p className="text-gray-400 text-xs text-center">
                    Your previous appeal was denied. You may submit a new one.
                  </p>
                  {!showAppealForm && (
                    <Button
                      onClick={() => setShowAppealForm(true)}
                      variant="outline"
                      className="w-full border-amber-500/30 hover:bg-amber-500/10 text-amber-300"
                      data-testid="button-new-appeal"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit New Appeal
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            !showAppealForm && (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm text-center">
                  If you believe this {isBanned ? "ban" : "suspension"} was made in error, you can submit an appeal for review.
                </p>
                <Button
                  onClick={() => setShowAppealForm(true)}
                  variant="outline"
                  className="w-full border-amber-500/30 hover:bg-amber-500/10 text-amber-300"
                  data-testid="button-submit-appeal"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit an Appeal
                </Button>
              </div>
            )
          )}

          {showAppealForm && canSubmitNewAppeal && (
            <Form {...appealForm}>
              <form
                onSubmit={appealForm.handleSubmit((data) => submitAppealMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={appealForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-300 text-sm">Why should your {isBanned ? "ban" : "suspension"} be lifted?</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Please explain why you believe this action should be reconsidered..."
                          className="bg-gray-900/50 border-gray-600 text-white min-h-[100px] resize-none"
                          data-testid="input-appeal-reason"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-gray-400 hover:text-white"
                    onClick={() => setShowAppealForm(false)}
                    data-testid="button-cancel-appeal"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitAppealMutation.isPending}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    data-testid="button-confirm-appeal"
                  >
                    {submitAppealMutation.isPending ? "Submitting..." : "Submit Appeal"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full text-gray-400 hover:text-white"
            data-testid="button-back-to-login"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
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

  if (banInfo) {
    return (
      <BanNotificationScreen
        banInfo={banInfo}
        onBack={() => setBanInfo(null)}
      />
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
