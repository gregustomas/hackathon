'use client'

import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { LogOut, Settings, LayoutDashboard, Wallet, Check, Smartphone } from 'lucide-react'
import { logout } from '@/app/dashboard/actions'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"


// Nové props pro účty
interface Account {
  id: string;
  account_number: string;
  balance: number;
}

interface UserNavProps {
  firstName: string
  lastName: string
  email: string
  role: string
  accounts?: Account[]
  fallbackAccountId?: string
}

export function UserNav({ firstName, lastName, email, role, accounts = [], fallbackAccountId }: UserNavProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()

  const dashboardHome = role === 'ADMIN' ? '/dashboard/admin' 
                      : role === 'BANKER' ? '/dashboard/banker'
                      : role === 'CHILD' ? '/dashboard/child'
                      : '/dashboard/client'

  const currentAccountId = searchParams.get('account') || fallbackAccountId;

  const handleAccountChange = (newAccountId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('account', newAccountId)
    router.push(`?${params.toString()}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative rounded-full size-10">
          <Avatar className="shadow-sm border size-10">
            <AvatarFallback className="bg-primary/10 font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-sm leading-none">{firstName} {lastName}</p>
            <p className="text-muted-foreground text-xs leading-none">{email}</p>
          </div>
        </DropdownMenuLabel>
        
        {accounts.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              Vaše účty
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {accounts.map(acc => (
                <DropdownMenuItem 
                  key={acc.id}
                  onClick={() => handleAccountChange(acc.id)}
                  className="flex justify-between items-center py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{acc.account_number}</span>
                      <span className="text-muted-foreground text-xs">{Number(acc.balance).toLocaleString("cs-CZ")} CZK</span>
                    </div>
                  </div>
                  {currentAccountId === acc.id && (
                    <Check className="size-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={dashboardHome} className="flex items-center w-full cursor-pointer">
              <LayoutDashboard className="mr-2 size-4" />
              <span>Přehled účtu</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" className="flex items-center w-full cursor-pointer">
              <Settings className="mr-2 size-4" />
              <span>Nastavení a 2FA</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings/devices" className="flex items-center w-full cursor-pointer">
            <Smartphone className="mr-2 size-4" />
            <span>Přihlášená zařízení</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="focus:bg-red-800/30 text-red-600 focus:text-red-600 cursor-pointer"
          onClick={async () => await logout()}
        >
          <LogOut className="mr-2 size-4" />
          <span>Odhlásit se</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
