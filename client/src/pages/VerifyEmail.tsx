import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, RefreshCw, LogIn } from "lucide-react";
import { Link } from "wouter";

export default function VerifyEmail() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const email = params.get("email");
  const { toast } = useToast();
  const [resent, setResent] = useState(false);

  const resendMutation = useMutation({
    mutationFn: (emailAddr: string) => apiRequest("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email: emailAddr }),
    }),
    onSuccess: () => {
      setResent(true);
      toast({
        title: "Verification Email Sent",
        description: "Check your inbox for a new verification link.",
      });
    },
    onError: () => {
      toast({
        title: "Failed",
        description: "Could not resend verification email. Try again later.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-emerald-400/20 shadow-xl">
        <CardHeader className="text-center space-y-4">
          {status === "success" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-emerald-300" data-testid="text-verify-success">
                Email Verified!
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Your email has been verified successfully. You can now log in to your account.
              </p>
            </>
          )}

          {status === "expired" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-amber-300" data-testid="text-verify-expired">
                Link Expired
              </CardTitle>
              <p className="text-gray-400 text-sm">
                This verification link has expired. Request a new one below.
              </p>
            </>
          )}

          {status === "invalid" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-300" data-testid="text-verify-invalid">
                Invalid Link
              </CardTitle>
              <p className="text-gray-400 text-sm">
                This verification link is invalid or has already been used.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-300" data-testid="text-verify-error">
                Verification Failed
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Something went wrong while verifying your email. Please try again.
              </p>
            </>
          )}

          {!status && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-500/10 flex items-center justify-center">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-300" data-testid="text-verify-pending">
                Verifying...
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Processing your verification link.
              </p>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {status === "success" && (
            <Link href="/login">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="button-go-to-login"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Go to Login
              </Button>
            </Link>
          )}

          {(status === "expired" || status === "error") && email && !resent && (
            <Button
              onClick={() => resendMutation.mutate(email)}
              variant="outline"
              className="w-full border-amber-500/30 hover:bg-amber-500/10 text-amber-300"
              disabled={resendMutation.isPending}
              data-testid="button-resend-from-verify"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${resendMutation.isPending ? "animate-spin" : ""}`} />
              {resendMutation.isPending ? "Sending..." : "Resend Verification Email"}
            </Button>
          )}

          {resent && (
            <p className="text-center text-emerald-400 text-sm" data-testid="text-resent-confirmation">
              A new verification link has been sent to your email.
            </p>
          )}

          {status !== "success" && (
            <Link href="/login">
              <Button
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
                data-testid="button-back-login-verify"
              >
                Back to Login
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
