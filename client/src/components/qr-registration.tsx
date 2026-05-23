import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QrCode, Smartphone, Download, Users, UserPlus, Share2, Copy, CheckCircle } from "lucide-react";
import * as QRCode from "qrcode";
import { useRoute } from "wouter";
import type { Player } from "@shared/schema";

const quickRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  city: z.enum(["Seguin", "New Braunfels", "San Marcos"]),
  rating: z.number().min(200, "Minimum rating is 200").max(800, "Maximum rating is 800").optional(),
  theme: z.string().optional(),
  phone: z.string().optional(),
  membershipTier: z.enum(["none", "basic", "pro"]).optional(),
});

type QuickRegistrationData = z.infer<typeof quickRegistrationSchema>;

interface QRRegistrationSession {
  id: string;
  qrCode: string;
  registrationUrl: string;
  expiresAt: string;
  registrations: Player[];
  active: boolean;
}

function GenerateQRDialog() {
  const [open, setOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const { toast } = useToast();

  const generateQRCode = async (url: string) => {
    try {
      const qrCodeUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#00ff00",
          light: "#000000",
        },
      });
      setQrCodeData(qrCodeUrl);
    } catch {
      toast({
        title: "Error",
        description: "Could not render QR code image",
        variant: "destructive",
      });
    }
  };

  const generateQRMutation = useMutation({
    mutationFn: () => apiRequest("/api/qr-registration/generate", { method: "POST" }) as Promise<QRRegistrationSession>,
    onSuccess: (data) => {
      setRegistrationUrl(data.registrationUrl);
      generateQRCode(data.registrationUrl);
      toast({
        title: "QR Code Generated",
        description: "Players can scan this code to register quickly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to generate QR code",
        variant: "destructive",
      });
    },
  });

  const downloadQR = () => {
    if (!qrCodeData) return;
    const link = document.createElement("a");
    link.download = "actionladder-registration-qr.png";
    link.href = qrCodeData;
    link.click();
  };

  const copyUrl = async () => {
    if (!registrationUrl) return;
    try {
      await navigator.clipboard.writeText(registrationUrl);
      toast({
        title: "URL Copied",
        description: "Registration URL copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Could not copy URL.",
        variant: "destructive",
      });
    }
  };

  const shareQR = async () => {
    if (!registrationUrl) return;
    if (navigator.share) {
      await navigator.share({
        title: "Join ActionLadder Billiards",
        text: "Scan this QR code to register for our billiards ladder.",
        url: registrationUrl,
      });
      return;
    }
    await copyUrl();
  };

  const resetDialog = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQrCodeData("");
      setRegistrationUrl("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={resetDialog}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700" data-testid="generate-qr-button">
          <QrCode className="w-4 h-4 mr-2" />
          Generate QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-black/95 border border-green-500/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">QR Code Registration</DialogTitle>
        </DialogHeader>

        {!qrCodeData ? (
          <div className="text-center py-8">
            <QrCode className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Generate Registration QR Code</h3>
            <p className="text-gray-400 mb-6">
              Create a QR code that players can scan to quickly register for the ladder.
            </p>
            <Button
              onClick={() => generateQRMutation.mutate()}
              disabled={generateQRMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {generateQRMutation.isPending ? <LoadingSpinner size="sm" /> : "Generate QR Code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <img
                src={qrCodeData}
                alt="Registration QR Code"
                className="mx-auto mb-4 rounded-lg border border-green-500/30"
              />
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Registration URL:</p>
                <p className="text-sm text-green-400 font-mono break-all">{registrationUrl}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button onClick={downloadQR} variant="outline" size="sm" className="text-xs" data-testid="download-qr-button">
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
              <Button onClick={copyUrl} variant="outline" size="sm" className="text-xs" data-testid="copy-url-button">
                <Copy className="w-3 h-3 mr-1" />
                Copy URL
              </Button>
              <Button onClick={shareQR} variant="outline" size="sm" className="text-xs" data-testid="share-qr-button">
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
            </div>

            <div className="bg-gray-900/50 border border-gray-600/30 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Instructions:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>- Print or display this QR code at your pool hall.</li>
                <li>- Players scan with their phone camera.</li>
                <li>- They are taken to a mobile-friendly registration form.</li>
                <li>- New registrations appear in your dashboard.</li>
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickRegistrationForm({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();

  const form = useForm<QuickRegistrationData>({
    resolver: zodResolver(quickRegistrationSchema),
    defaultValues: {
      name: "",
      city: "San Marcos",
      rating: 500,
      theme: "",
      phone: "",
      membershipTier: "none",
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: QuickRegistrationData) =>
      apiRequest(`/api/qr-registration/${sessionId}/register`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Welcome to ActionLadder Billiards. Your profile has been created.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error?.message || "Unable to complete registration",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="max-w-md mx-auto bg-black/90 border border-green-500/30">
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <UserPlus className="w-8 h-8 text-green-400" />
        </div>
        <CardTitle className="text-white">Join ActionLadder</CardTitle>
        <p className="text-gray-400 text-sm">Quick mobile registration with no membership required.</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your name" className="bg-black/50 border-green-500/30 text-white" data-testid="registration-name-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">City *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-black/50 border-green-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[120]">
                      <SelectItem value="Seguin">Seguin</SelectItem>
                      <SelectItem value="New Braunfels">New Braunfels</SelectItem>
                      <SelectItem value="San Marcos">San Marcos</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Fargo Rating (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={200}
                      max={800}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
                      placeholder="500"
                      className="bg-black/50 border-green-500/30 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Theme/Motto (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Chalk and hustle" className="bg-black/50 border-green-500/30 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="(555) 123-4567" className="bg-black/50 border-green-500/30 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="membershipTier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Membership Tier (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-black/50 border-green-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[120]">
                      <SelectItem value="none">No Membership (Free)</SelectItem>
                      <SelectItem value="basic">Basic - $25/month</SelectItem>
                      <SelectItem value="pro">Pro - $45/month</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-400 mt-1">
                    You can join and play without any membership. Memberships offer reduced fees and extra benefits.
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={registerMutation.isPending} className="w-full bg-green-600 hover:bg-green-700" data-testid="submit-registration-button">
              {registerMutation.isPending ? <LoadingSpinner size="sm" /> : "Join the Ladder"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function RegistrationStats() {
  const { data: stats } = useQuery({ queryKey: ["/api/qr-registration/stats"] });
  const registrationStats = (stats as any) || {
    totalQRRegistrations: 0,
    todayRegistrations: 0,
    activeSession: null,
    recentRegistrations: [],
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{registrationStats.totalQRRegistrations}</div>
          <div className="text-xs text-gray-400">Total QR Registrations</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{registrationStats.todayRegistrations}</div>
          <div className="text-xs text-gray-400">Today</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{registrationStats.activeSession ? "Active" : "Inactive"}</div>
          <div className="text-xs text-gray-400">QR Session</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{registrationStats.recentRegistrations.length}</div>
          <div className="text-xs text-gray-400">Recent</div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentRegistrations() {
  const { data: recentRegistrations = [] } = useQuery<Player[]>({ queryKey: ["/api/qr-registration/recent"] });

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Users className="w-5 h-5 mr-2 text-green-400" />
          Recent QR Registrations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentRegistrations.length === 0 ? (
          <div className="text-center py-8">
            <Smartphone className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No recent QR registrations</p>
            <p className="text-gray-500 text-sm mt-1">Generate a QR code to start collecting sign-ups.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRegistrations.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg">
                <div>
                  <div className="font-semibold text-white">{player.name}</div>
                  <div className="text-sm text-gray-400">
                    {player.city} • Rating: {player.rating}
                  </div>
                  {player.theme && <div className="text-xs text-gray-500 italic">"{player.theme}"</div>}
                </div>
                <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Registered
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PublicQRRegistration() {
  const [match, params] = useRoute("/register/:sessionId");
  const sessionId = match ? params?.sessionId : "";

  return (
    <div className="min-h-[70vh] py-10 px-4" data-testid="public-qr-registration-page">
      <QuickRegistrationForm sessionId={sessionId || "invalid-session"} />
    </div>
  );
}

export default function QRRegistration() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">QR Code Registration</h1>
          <p className="text-gray-400">Easy mobile sign-up for new players.</p>
        </div>
        <GenerateQRDialog />
      </div>

      <RegistrationStats />

      <div className="grid lg:grid-cols-2 gap-6">
        <RecentRegistrations />
        <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <QrCode className="w-5 h-5 mr-2 text-green-400" />
              How QR Registration Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-green-400 text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Generate QR Code</h4>
                  <p className="text-gray-400 text-sm">Create a unique QR code for your venue or event.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-green-400 text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Display QR Code</h4>
                  <p className="text-gray-400 text-sm">Print or show the QR code at your pool hall entrance.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-green-400 text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Players Scan</h4>
                  <p className="text-gray-400 text-sm">New players scan with their phone camera.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-green-400 text-sm font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Instant Registration</h4>
                  <p className="text-gray-400 text-sm">Mobile-friendly form with instant ladder entry.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
