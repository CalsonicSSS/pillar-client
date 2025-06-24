'use client';

import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings, HelpCircle } from 'lucide-react';

export function AppHeader() {
  return (
    <header className='bg-white border-b border-gray-200 sticky top-0 z-50'>
      <div className='container mx-auto px-4 max-w-7xl'>
        <div className='flex items-center justify-between h-16'>
          {/* Left side - App branding */}
          <div className='flex items-center gap-8'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>P</span>
              </div>
              <h1 className='text-xl font-bold text-gray-900'>Pillar</h1>
            </div>
          </div>

          {/* Right side - User menu */}
          <div className='flex items-center gap-4'>
            {/* Help dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon'>
                  <HelpCircle className='h-5 w-5' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem>Documentation</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings button */}
            <Button variant='ghost' size='icon'>
              <Settings className='h-5 w-5' />
            </Button>

            {/* Clerk User Button */}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
