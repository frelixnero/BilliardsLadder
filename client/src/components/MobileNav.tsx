import { useState } from "react";
import { Menu, X, ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import type { GlobalRole } from "@shared/schema";

interface NavigationGroup {
  id: string;
  label: string;
  icon: any;
  roles?: GlobalRole[];
  items: { id: string; label: string; roles?: GlobalRole[] }[];
}

interface MobileNavProps {
  navigationGroups: NavigationGroup[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: GlobalRole;
}

export function MobileNav({ navigationGroups, activeTab, setActiveTab, userRole }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const { isAuthenticated } = useAuth();

  // Filter groups based on user role
  const visibleGroups = navigationGroups.filter(group => 
    !group.roles || userRole === "OWNER" || group.roles.includes(userRole)
  );

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleItemClick = (itemId: string) => {
    setIsOpen(false);
    window.location.href = `/app?tab=${itemId}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden p-2 text-emerald-200 hover:text-white hover:bg-emerald-500/20"
          data-testid="button-mobile-menu"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent 
        side="left" 
        className="w-80 bg-[#0d1f12]/95 backdrop-blur border-r border-emerald-400/20 p-0"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-emerald-400/20">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => {
                setIsOpen(false);
                window.location.href = "/";
              }}
            >
              <img 
                src="/billiards-logo.svg"
                alt="Action Ladder Billiards Logo"
                className="h-8 w-8 rounded-lg object-cover border border-emerald-400/30"
              />
              <span className="font-bold text-emerald-300 text-sm">ACTIONLADDER</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="p-1 text-emerald-200 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {visibleGroups.map((group) => {
              const Icon = group.icon;
              const isOpen = openGroups.includes(group.id);
              const hasActiveItem = group.items.some(item => item.id === activeTab);

              return (
                <Collapsible
                  key={group.id}
                  open={isOpen}
                  onOpenChange={() => toggleGroup(group.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-between p-3 h-auto hover:bg-emerald-500/10 ${
                        hasActiveItem ? "bg-emerald-500/20 text-white" : "text-emerald-100/90"
                      }`}
                      data-testid={`mobile-nav-group-${group.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{group.label}</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-1 mt-1">
                    {group.items
                      .filter(item => !item.roles || userRole === "OWNER" || item.roles.includes(userRole))
                      .map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <Button
                            key={item.id}
                            variant="ghost"
                            onClick={() => handleItemClick(item.id)}
                            className={`w-full justify-start pl-12 py-2 h-auto text-sm hover:bg-emerald-500/10 ${
                              isActive ? "bg-emerald-500/30 text-white font-medium" : "text-emerald-100/80"
                            }`}
                            data-testid={`mobile-nav-item-${item.id}`}
                          >
                            {item.label}
                          </Button>
                        );
                      })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-emerald-400/20 space-y-3">
            {isAuthenticated ? (
              <Button
                onClick={() => {
                  setIsOpen(false);
                  fetch("/api/auth/logout", { method: "POST", credentials: "include" })
                    .then(() => { window.location.href = "/"; })
                    .catch(() => { window.location.href = "/"; });
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-2.5"
                data-testid="button-logout-mobile"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => { setIsOpen(false); window.location.href = "/login"; }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-2.5"
                  data-testid="button-login-mobile"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => { setIsOpen(false); window.location.href = "/signup"; }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-2.5"
                  data-testid="button-signup-mobile"
                >
                  Sign Up
                </Button>
              </div>
            )}
            <p className="text-xs text-emerald-200/70 text-center">
              In here, respect is earned in racks, not words
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}