import React, { useState } from "react";
import {
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Menu,
} from "lucide-react";

import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../shadcn/components/ui/avatar";
import { Badge } from "../../shadcn/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../shadcn/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../shadcn/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../../shadcn/components/ui/sheet";
import { Link } from "react-router-dom";

// Removed TypeScript interface and type annotation

const Header = ({ onMenuToggle, showMobileMenu = true }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount] = useState(7);

  const handleLogout = () => {
    // Add logout logic here
    console.log("Logout clicked");
  };

  const handleProfileSettings = () => {};

  const handleNotificationClick = () => {
    // Add notification logic here
    console.log("Notifications clicked");
  };

  const handleSettingsClick = () => {
    // Add settings logic here
    console.log("Settings clicked");
  };

  return (
    <TooltipProvider>
      <header className="sticky top-0 hidden md:block w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          {/* Left Section - Mobile Menu + Search */}
          <div className="flex items-center gap-4 flex-1">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers, invoices, vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border pr-4 w-full bg-muted/50 focus-visible:bg-background focus-visible:ring-2"
              />
            </div>
          </div>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={handleNotificationClick}
                >
                  <Bell className="h-6 w-6" />
                  {notificationCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-0 -right-0 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center"
                    >
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </Badge>
                  )}
                  <span className="sr-only">
                    Notifications{" "}
                    {notificationCount > 0 && `(${notificationCount})`}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Notifications</p>
              </TooltipContent>
            </Tooltip>

            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSettingsClick}
                >
                  <Settings className="h-6 w-6" />
                  <span className="sr-only">Settings</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-auto px-2 hover:bg-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src="/placeholder.svg?height=32&width=32"
                        alt="Admin User"
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        MJ
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start text-left">
                      <span className="text-sm font-medium leading-none">
                        Mudassar Javed
                      </span>
                      <span className="text-xs text-muted-foreground leading-none mt-1">
                        mudassar.umar89@gmail.com
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Mudassar Javed
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      mudassar.umar89@gmail.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleProfileSettings}
                  className="cursor-pointer"
                >
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};

export default Header;
