import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Settings, MapPin, Palette, Gift } from "lucide-react";

interface OperatorSettings {
  id: string;
  operatorUserId: string;
  cityName: string;
  areaName: string;
  customBranding?: string;
  hasFreeMonths: boolean;
  freeMonthsCount: number;
  freeMonthsGrantedBy?: string;
  freeMonthsGrantedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OperatorSettings() {
  const { user } = useAuth();
  const operatorUserId = user?.id || "";
  
  const [cityName, setCityName] = useState("");
  const [areaName, setAreaName] = useState("");
  const [customBranding, setCustomBranding] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get operator's current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/operator/settings", operatorUserId],
    queryFn: async () => {
      return await apiRequest("GET", `/api/operator/settings?userId=${operatorUserId}`);
    },
    refetchOnMount: true,
  });

  // Initialize form when settings load
  if (settings && !isInitialized) {
    setCityName(settings.cityName || "");
    setAreaName(settings.areaName || "");
    setCustomBranding(settings.customBranding || "");
    setIsInitialized(true);
  }

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { cityName: string; areaName: string; customBranding?: string }) => {
      return await apiRequest("PUT", `/api/operator/settings?userId=${operatorUserId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your operator settings have been saved successfully. Redirecting to subscription setup...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/operator/settings", operatorUserId] });
      setTimeout(() => {
        window.location.href = "/app?tab=operator-subscriptions";
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    if (!cityName.trim() || !areaName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both city and area names",
        variant: "destructive",
      });
      return;
    }

    updateSettingsMutation.mutate({
      cityName: cityName.trim(),
      areaName: areaName.trim(),
      customBranding: customBranding.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading operator settings...</p>
        </div>
      </div>
    );
  }

  const operatorSettings = settings as OperatorSettings;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="operator-settings">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-400 mb-2">Operator Settings</h1>
        <p className="text-gray-300">Customize your ActionLadder instance for your city and area</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Free Months Status */}
        {operatorSettings?.hasFreeMonths && (
          <Card className="bg-black/60 border-green-600/30">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center">
                <Gift className="w-5 h-5 mr-2" />
                Free Months Active
              </CardTitle>
              <CardDescription className="text-gray-300">
                You have been granted free months by the platform trustee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Badge className="bg-green-600 text-black font-semibold">
                    {operatorSettings.freeMonthsCount} Free Months Remaining
                  </Badge>
                  {operatorSettings.freeMonthsGrantedAt && (
                    <p className="text-gray-400 text-sm mt-2">
                      Granted on: {new Date(operatorSettings.freeMonthsGrantedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">No billing charges</p>
                  <p className="text-gray-400 text-sm">Until free months are used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location Customization */}
        <Card className="bg-black/60 border-green-600/30">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Location Settings
            </CardTitle>
            <CardDescription className="text-gray-300">
              Set your city and area to personalize the ActionLadder experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cityName" className="text-gray-300">
                  City Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="cityName"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g., San Antonio"
                  className="bg-black/40 border-green-600/50 text-white"
                  data-testid="input-city-name"
                />
              </div>
              <div>
                <Label htmlFor="areaName" className="text-gray-300">
                  Area Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="areaName"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g., South Texas"
                  className="bg-black/40 border-green-600/50 text-white"
                  data-testid="input-area-name"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-400">
                This will customize the branding throughout your ActionLadder instance.
                For example: "{cityName || "Your City"} {areaName || "Your Area"} ActionLadder"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Custom Branding */}
        <Card className="bg-black/60 border-green-600/30">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Custom Branding
            </CardTitle>
            <CardDescription className="text-gray-300">
              Optional: Add custom branding text to further personalize your instance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customBranding" className="text-gray-300">
                Custom Branding Text
              </Label>
              <Textarea
                id="customBranding"
                value={customBranding}
                onChange={(e) => setCustomBranding(e.target.value)}
                placeholder="e.g., Sponsored by [Your Business Name] or [Custom Tagline]"
                className="bg-black/40 border-green-600/50 text-white"
                rows={3}
                data-testid="input-custom-branding"
              />
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-400">
                This text will appear in select locations throughout your ActionLadder instance for additional branding.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="bg-black/60 border-green-600/30">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Preview
            </CardTitle>
            <CardDescription className="text-gray-300">
              See how your customization will appear - try the interactive demo!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black/40 rounded-lg p-4 border border-green-600/20">
              <h3 className="text-xl font-bold text-green-400 mb-2">
                {cityName || "Your City"} {areaName || "Your Area"} ActionLadder
              </h3>
              <p className="text-gray-300 mb-2">
                In here, respect is earned in racks, not words
              </p>
              {customBranding && (
                <p className="text-green-400 text-sm italic mb-3">
                  {customBranding}
                </p>
              )}
              
              {/* Interactive Demo Actions */}
              <div className="space-y-2 mt-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-black font-semibold"
                    onClick={() => toast({
                      title: "Challenge Created!",
                      description: `Demo: Challenge in ${cityName || "Your City"} ${areaName || "Your Area"}`,
                    })}
                  >
                    Create Challenge
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                    onClick={() => toast({
                      title: "Live Stream Started!",
                      description: `Demo: Broadcasting from ${cityName || "Your City"} ${areaName || "Your Area"}`,
                    })}
                  >
                    Start Stream
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    onClick={() => toast({
                      title: "Tournament Joined!",
                      description: `Demo: Entered ${cityName || "Your City"} tournament`,
                    })}
                  >
                    Join Tournament
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    onClick={() => toast({
                      title: "Ladder Updated!",
                      description: `Demo: Climbed the ${areaName || "Your Area"} ladder`,
                    })}
                  >
                    View Ladder
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 p-2 bg-green-900/20 rounded text-xs text-green-300">
                💡 This preview shows how your branding will appear throughout the ActionLadder platform
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-black font-semibold px-8"
            data-testid="button-save-settings"
          >
            {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}