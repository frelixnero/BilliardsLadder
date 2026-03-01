import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <Card className="w-full max-w-md mx-4 bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-white" data-testid="text-404-title">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-400" data-testid="text-404-message">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="mt-6">
            <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm hover:underline" data-testid="link-back-home">
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
