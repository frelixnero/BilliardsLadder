import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Settings, DollarSign, Users, TrendingUp, Calculator, Save, Eye, RefreshCw } from 'lucide-react';

// Form validation schema
const revenueConfigSchema = z.object({
  name: z.string().min(1, 'Configuration name is required'),
  splitPercentages: z.object({
    actionLadder: z.number().min(0).max(100),
    operator: z.number().min(0).max(100),
    seasonPot: z.number().min(0).max(100),
    monthlyOperations: z.number().min(0).max(100),
  }).refine(
    (data) => data.actionLadder + data.operator + data.seasonPot + data.monthlyOperations === 100,
    { message: 'Percentages must add up to exactly 100%' }
  ),
  commissionRates: z.object({
    nonMember: z.number().min(0).max(5000),
    rookie: z.number().min(0).max(5000),
    standard: z.number().min(0).max(5000),
    premium: z.number().min(0).max(5000),
  }),
  membershipPricing: z.object({
    rookie: z.number().min(100),
    standard: z.number().min(100),
    premium: z.number().min(100),
  }),
  settings: z.object({
    roundUpEnabled: z.boolean(),
    operatorMonthlyTarget: z.number().min(0),
    trusteeWeeklyTarget: z.number().min(0),
  }),
  modifiedBy: z.string().min(1),
});

type RevenueConfigFormData = z.infer<typeof revenueConfigSchema>;

interface RevenueConfig {
  id: string;
  name: string;
  splitPercentages: {
    actionLadder: number;
    operator: number;
    seasonPot: number;
    monthlyOperations: number;
  };
  commissionRates: {
    nonMember: number;
    rookie: number;
    standard: number;
    premium: number;
  };
  membershipPricing: {
    rookie: number;
    standard: number;
    premium: number;
  };
  settings: {
    roundUpEnabled: boolean;
    operatorMonthlyTarget: number;
    trusteeWeeklyTarget: number;
  };
  lastModified: string;
  modifiedBy: string;
}

export default function RevenueAdmin() {
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [previewAmount, setPreviewAmount] = useState(10000); // $100 default
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current configuration
  const { data: currentConfig, isLoading: isLoadingCurrent } = useQuery<{ config: RevenueConfig }>({
    queryKey: ['/api/admin/revenue-config'],
  });

  // Fetch all available configurations
  const { data: allConfigsData, isLoading: isLoadingAll } = useQuery<{ 
    configs: RevenueConfig[]; 
    activeConfigId: string; 
  }>({
    queryKey: ['/api/admin/revenue-configs'],
  });

  // Initialize form with current configuration
  const form = useForm<RevenueConfigFormData>({
    resolver: zodResolver(revenueConfigSchema),
    defaultValues: {
      name: '',
      splitPercentages: {
        actionLadder: 23,
        operator: 33,
        seasonPot: 43,
        monthlyOperations: 1,
      },
      commissionRates: {
        nonMember: 3000,
        rookie: 1800,
        standard: 2400,
        premium: 3400,
      },
      membershipPricing: {
        rookie: 1399,
        standard: 2499,
        premium: 7499,
      },
      settings: {
        roundUpEnabled: true,
        operatorMonthlyTarget: 50000,
        trusteeWeeklyTarget: 17500,
      },
      modifiedBy: 'admin',
    },
  });

  // Update form when current config loads
  useEffect(() => {
    if (currentConfig?.config) {
      const config = currentConfig.config;
      form.reset({
        name: config.name,
        splitPercentages: config.splitPercentages,
        commissionRates: config.commissionRates,
        membershipPricing: config.membershipPricing,
        settings: config.settings,
        modifiedBy: 'admin',
      });
    }
  }, [currentConfig, form]);

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (data: RevenueConfigFormData) => {
      return apiRequest('/api/admin/revenue-config', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved!",
        description: "Revenue configuration has been updated and activated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/revenue-config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/revenue-configs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Unable to save configuration.",
        variant: "destructive",
      });
    },
  });

  // Activate existing configuration mutation
  const activateConfigMutation = useMutation({
    mutationFn: async (configId: string) => {
      return apiRequest('/api/admin/revenue-config/activate', {
        method: 'POST',
        body: JSON.stringify({ configId, modifiedBy: 'admin' }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuration Activated!",
        description: "Revenue configuration has been switched successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/revenue-config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/revenue-configs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Activation Failed",
        description: error.message || "Unable to activate configuration.",
        variant: "destructive",
      });
    },
  });

  const handleSave = async (data: RevenueConfigFormData) => {
    await saveConfigMutation.mutateAsync(data);
  };

  const handleActivateConfig = async () => {
    if (selectedConfigId) {
      await activateConfigMutation.mutateAsync(selectedConfigId);
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatPercent = (bps: number) => `${(bps / 100).toFixed(1)}%`;

  if (isLoadingCurrent || isLoadingAll) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" color="neon" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-felt-green/10 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Settings className="mr-3 text-neon-green" />
          Revenue Configuration Admin
        </h1>
        <p className="text-gray-400 mt-2">
          Manage revenue sharing percentages and commission rates
        </p>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="bg-gray-800 text-white">
          <TabsTrigger value="current" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
            Current Configuration
          </TabsTrigger>
          <TabsTrigger value="modify" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
            Modify Configuration
          </TabsTrigger>
          <TabsTrigger value="presets" className="data-[state=active]:bg-neon-green data-[state=active]:text-black">
            Preset Configurations
          </TabsTrigger>
        </TabsList>

        {/* Current Configuration Tab */}
        <TabsContent value="current" className="space-y-6">
          {currentConfig?.config && (
            <>
              {/* Current Configuration Summary */}
              <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/30 shadow-felt">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center">
                    <TrendingUp className="mr-3 text-neon-green" />
                    Active Configuration: {currentConfig.config.name}
                  </CardTitle>
                  <div className="text-sm text-gray-400">
                    Last modified: {new Date(currentConfig.config.lastModified).toLocaleString()} by {currentConfig.config.modifiedBy}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Revenue Split */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-white flex items-center">
                        <DollarSign className="mr-2 h-4 w-4 text-dollar-green" />
                        Revenue Split
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Trustees/Founders</span>
                          <span className="text-white font-medium">{currentConfig.config.splitPercentages.actionLadder}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Operators</span>
                          <span className="text-white font-medium">{currentConfig.config.splitPercentages.operator}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Season Pot</span>
                          <span className="text-white font-medium">{currentConfig.config.splitPercentages.seasonPot}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Operations</span>
                          <span className="text-white font-medium">{currentConfig.config.splitPercentages.monthlyOperations}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Commission Rates */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-white flex items-center">
                        <Calculator className="mr-2 h-4 w-4 text-blue-400" />
                        Commission Rates
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Non-Members</span>
                          <span className="text-white font-medium">{formatPercent(currentConfig.config.commissionRates.nonMember)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rookie</span>
                          <span className="text-white font-medium">{formatPercent(currentConfig.config.commissionRates.rookie)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Standard</span>
                          <span className="text-white font-medium">{formatPercent(currentConfig.config.commissionRates.standard)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Premium</span>
                          <span className="text-white font-medium">{formatPercent(currentConfig.config.commissionRates.premium)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Membership Pricing */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-white flex items-center">
                        <Users className="mr-2 h-4 w-4 text-purple-400" />
                        Membership Pricing
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rookie</span>
                          <span className="text-white font-medium">{formatCurrency(currentConfig.config.membershipPricing.rookie)}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Standard</span>
                          <span className="text-white font-medium">{formatCurrency(currentConfig.config.membershipPricing.standard)}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Premium</span>
                          <span className="text-white font-medium">{formatCurrency(currentConfig.config.membershipPricing.premium)}/mo</span>
                        </div>
                      </div>
                    </div>

                    {/* Targets & Settings */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-white flex items-center">
                        <Settings className="mr-2 h-4 w-4 text-amber-400" />
                        Targets & Settings
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Operator Target</span>
                          <span className="text-white font-medium">{formatCurrency(currentConfig.config.settings.operatorMonthlyTarget)}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Trustee Target</span>
                          <span className="text-white font-medium">{formatCurrency(currentConfig.config.settings.trusteeWeeklyTarget)}/wk</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Round Up</span>
                          <span className="text-white font-medium">{currentConfig.config.settings.roundUpEnabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Modify Configuration Tab */}
        <TabsContent value="modify" className="space-y-6">
          <Card className="bg-black/60 backdrop-blur-sm border border-blue-500/30 shadow-felt">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <Settings className="mr-3 text-blue-400" />
                Create New Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                {/* Configuration Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Configuration Name</Label>
                  <Input
                    {...form.register('name')}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Enter configuration name..."
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-400 text-sm">{form.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Revenue Split Percentages */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Revenue Split Percentages</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Trustees/Founders (%)</Label>
                      <Input
                        type="number"
                        {...form.register('splitPercentages.actionLadder', { valueAsNumber: true })}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Operators (%)</Label>
                      <Input
                        type="number"
                        {...form.register('splitPercentages.operator', { valueAsNumber: true })}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Season Pot (%)</Label>
                      <Input
                        type="number"
                        {...form.register('splitPercentages.seasonPot', { valueAsNumber: true })}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Operations (%)</Label>
                      <Input
                        type="number"
                        {...form.register('splitPercentages.monthlyOperations', { valueAsNumber: true })}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                  {form.formState.errors.splitPercentages && (
                    <p className="text-red-400 text-sm">{form.formState.errors.splitPercentages.message}</p>
                  )}
                  {/* Total Percentage Display */}
                  <div className="text-sm text-gray-400">
                    Total: {
                      (form.watch('splitPercentages.actionLadder') || 0) +
                      (form.watch('splitPercentages.operator') || 0) +
                      (form.watch('splitPercentages.seasonPot') || 0) +
                      (form.watch('splitPercentages.monthlyOperations') || 0)
                    }% (must equal 100%)
                  </div>
                </div>

                {/* Commission Rates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Commission Rates (Basis Points)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Non-Members (bps)</Label>
                      <Input
                        type="number"
                        {...form.register('commissionRates.nonMember', { valueAsNumber: true })}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="0"
                        max="5000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Rookie (bps)</Label>
                      <Input
                        type="number"
                        {...form.register('commissionRates.rookie', { valueAsNumber: true })}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="0"
                        max="5000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Standard (bps)</Label>
                      <Input
                        type="number"
                        {...form.register('commissionRates.standard', { valueAsNumber: true })}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="0"
                        max="5000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Premium (bps)</Label>
                      <Input
                        type="number"
                        {...form.register('commissionRates.premium', { valueAsNumber: true })}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="0"
                        max="5000"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    Note: 100 basis points = 1%. Current rates: Non-Members {formatPercent(form.watch('commissionRates.nonMember') || 0)}, 
                    Rookie {formatPercent(form.watch('commissionRates.rookie') || 0)}, 
                    Standard {formatPercent(form.watch('commissionRates.standard') || 0)}, 
                    Premium {formatPercent(form.watch('commissionRates.premium') || 0)}
                  </div>
                </div>

                {/* Membership Pricing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Membership Pricing (Cents)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Rookie (cents)</Label>
                      <Input
                        type="number"
                        {...form.register('membershipPricing.rookie', { valueAsNumber: true })}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Standard (cents)</Label>
                      <Input
                        type="number"
                        {...form.register('membershipPricing.standard', { valueAsNumber: true })}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Premium (cents)</Label>
                      <Input
                        type="number"
                        {...form.register('membershipPricing.premium', { valueAsNumber: true })}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="100"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    Current pricing: Rookie {formatCurrency(form.watch('membershipPricing.rookie') || 0)}/mo, 
                    Standard {formatCurrency(form.watch('membershipPricing.standard') || 0)}/mo, 
                    Premium {formatCurrency(form.watch('membershipPricing.premium') || 0)}/mo
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Settings & Targets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Operator Monthly Target (cents)</Label>
                      <Input
                        type="number"
                        {...form.register('settings.operatorMonthlyTarget', { valueAsNumber: true })}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Trustee Weekly Target (cents)</Label>
                      <Input
                        type="number"
                        {...form.register('settings.trusteeWeeklyTarget', { valueAsNumber: true })}
                        className="bg-gray-800 border-gray-600 text-white"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Round Up Enabled</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Switch
                          checked={form.watch('settings.roundUpEnabled')}
                          onCheckedChange={(checked) => form.setValue('settings.roundUpEnabled', checked)}
                        />
                        <span className="text-gray-400">
                          {form.watch('settings.roundUpEnabled') ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modified By */}
                <div className="space-y-2">
                  <Label htmlFor="modifiedBy" className="text-white">Modified By</Label>
                  <Input
                    {...form.register('modifiedBy')}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Enter your name..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saveConfigMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  data-testid="button-save-config"
                >
                  {saveConfigMutation.isPending ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save & Activate Configuration
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preset Configurations Tab */}
        <TabsContent value="presets" className="space-y-6">
          <Card className="bg-black/60 backdrop-blur-sm border border-purple-500/30 shadow-felt">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <RefreshCw className="mr-3 text-purple-400" />
                Available Configurations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allConfigsData?.configs && (
                <div className="space-y-4">
                  {allConfigsData.configs.map((config) => (
                    <div
                      key={config.id}
                      className={`p-4 rounded border cursor-pointer transition-all ${
                        config.id === allConfigsData.activeConfigId
                          ? 'border-neon-green bg-neon-green/10'
                          : selectedConfigId === config.id
                          ? 'border-blue-400 bg-blue-400/10'
                          : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedConfigId(config.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{config.name}</h3>
                        <div className="flex items-center space-x-2">
                          {config.id === allConfigsData.activeConfigId && (
                            <Badge className="bg-neon-green text-black">Active</Badge>
                          )}
                          {selectedConfigId === config.id && config.id !== allConfigsData.activeConfigId && (
                            <Badge variant="outline" className="border-blue-400 text-blue-400">Selected</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 mb-3">
                        Modified: {new Date(config.lastModified).toLocaleString()} by {config.modifiedBy}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Revenue Split:</span>
                          <div className="text-white">
                            {config.splitPercentages.actionLadder}% / {config.splitPercentages.operator}% / {config.splitPercentages.seasonPot}% / {config.splitPercentages.monthlyOperations}%
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Commission Rates:</span>
                          <div className="text-white">
                            {formatPercent(config.commissionRates.nonMember)} / {formatPercent(config.commissionRates.rookie)} / {formatPercent(config.commissionRates.standard)} / {formatPercent(config.commissionRates.premium)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Membership:</span>
                          <div className="text-white">
                            {formatCurrency(config.membershipPricing.rookie)} / {formatCurrency(config.membershipPricing.standard)} / {formatCurrency(config.membershipPricing.premium)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Targets:</span>
                          <div className="text-white">
                            Op: {formatCurrency(config.settings.operatorMonthlyTarget)}/mo<br/>
                            Tr: {formatCurrency(config.settings.trusteeWeeklyTarget)}/wk
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {selectedConfigId && selectedConfigId !== allConfigsData.activeConfigId && (
                    <Button
                      onClick={handleActivateConfig}
                      disabled={activateConfigMutation.isPending}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold mt-4"
                      data-testid="button-activate-config"
                    >
                      {activateConfigMutation.isPending ? (
                        <>
                          <LoadingSpinner />
                          <span className="ml-2">Activating...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Activate Selected Configuration
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}