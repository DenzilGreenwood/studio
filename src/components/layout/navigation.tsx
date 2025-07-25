'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, Menu, UserCircle, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/context/auth-context-v2';
import { cn } from '@/lib/utils';

// Navigation configuration
export interface NavItem {
  label: string;
  href: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
  description?: string;
  external?: boolean;
}

export const publicNavItems: NavItem[] = [
  {
    label: 'AI Companion',
    href: '#ai',
    description: 'Learn about our AI-powered guidance'
  },
  {
    label: '1:1 Guidance',
    href: '#1on1',
    description: 'Work directly with James Greenwood'
  },
  {
    label: 'Case Study',
    href: '#case-study',
    description: 'See the protocol in action'
  },
  {
    label: 'How It Works',
    href: '/protocol-overview',
    description: 'Understand the Cognitive Edge Protocol'
  }
];

export const authenticatedNavItems: NavItem[] = [
  {
    label: 'Start Session',
    href: '/protocol',
    requiresAuth: true,
    description: 'Begin a new cognitive clarity session'
  },
  {
    label: 'My Sessions',
    href: '/sessions',
    requiresAuth: true,
    description: 'View your session history'
  },
  {
    label: 'My Progress',
    href: '/progress',
    requiresAuth: true,
    description: 'Track your growth over time'
  },
  {
    label: 'Journal',
    href: '/journal',
    requiresAuth: true,
    description: 'Personal reflection space'
  }
];

export const adminNavItems: NavItem[] = [
  {
    label: 'Admin Dashboard',
    href: '/admin',
    requiresAuth: true,
    adminOnly: true,
    description: 'System administration'
  },
  {
    label: 'User Management',
    href: '/admin/users',
    requiresAuth: true,
    adminOnly: true,
    description: 'Manage user accounts'
  }
];

interface NavigationProps {
  variant?: 'public' | 'app';
  className?: string;
}

export function Navigation({ variant = 'public', className }: NavigationProps) {
  const { user, firebaseUser, loading, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine which nav items to show
  const getNavItems = () => {
    if (variant === 'app' || firebaseUser) {
      return [
        ...authenticatedNavItems,
        ...(isAdmin() ? adminNavItems : [])
      ];
    }
    return publicNavItems;
  };

  // Handle navigation with auth checks
  const handleNavigation = (item: NavItem) => {
    if (item.requiresAuth && !firebaseUser) {
      router.push('/signup');
      return;
    }

    if (item.adminOnly && !isAdmin()) {
      router.push('/dashboard');
      return;
    }

    if (item.external) {
      window.open(item.href, '_blank');
      return;
    }

    // Handle anchor links on the same page
    if (item.href.startsWith('#')) {
      const element = document.getElementById(item.href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
        return;
      }
    }

    router.push(item.href);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch {
      // Handle logout error silently or show toast
    }
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="w-full px-4 sm:px-6 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <span className="font-headline text-2xl font-semibold text-primary">
            CognitiveInsight
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-6">
            {getNavItems().map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(item)}
                className="text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Button>
            ))}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4 ml-6 border-l border-border/40 pl-6">
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : firebaseUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(user?.displayName || firebaseUser.email)}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {user?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {firebaseUser.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  CognitiveInsight
                </SheetTitle>
                <SheetDescription>
                  Navigate to different sections and features
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 flex flex-col space-y-4">
                {/* User info for authenticated users */}
                {firebaseUser && (
                  <div className="pb-4 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(user?.displayName || firebaseUser.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">
                          {user?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {firebaseUser.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Items */}
                {getNavItems().map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    onClick={() => handleNavigation(item)}
                    className="justify-start h-auto p-3 flex flex-col items-start"
                  >
                    <span className="font-medium">{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </span>
                    )}
                  </Button>
                ))}

                {/* Auth Actions */}
                {firebaseUser ? (
                  <div className="pt-4 border-t border-border/40 space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/dashboard')}
                      className="justify-start w-full"
                    >
                      <UserCircle className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/settings')}
                      className="justify-start w-full"
                    >
                      <UserCircle className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="justify-start w-full text-destructive hover:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-border/40 space-y-2">
                    <Button
                      onClick={() => router.push('/login')}
                      variant="outline"
                      className="w-full"
                    >
                      Login
                    </Button>
                    <Button
                      onClick={() => router.push('/signup')}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
