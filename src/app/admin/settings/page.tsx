// src/app/admin/settings/page.tsx

import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

export const metadata = {
  title: 'Settings - BoothBoss Admin',
  description: 'Configure your photo booth settings',
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions) as Session | null;
  
  if (!session) {
    redirect('/login');
  }
  
  // Fetch current settings
  const settings = await prisma.settings.findFirst();
  
  if (!settings) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-700">
          Settings not found. Please run the database seed script to create default settings.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Booth Settings</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-sm text-gray-500 mb-6">
          The settings form will be implemented with client-side functionality in the next step.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium mb-4">Booth Configuration</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Event Name</dt>
                <dd className="mt-1 text-base text-gray-900">{settings.eventName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Countdown Time</dt>
                <dd className="mt-1 text-base text-gray-900">{settings.countdownTime} seconds</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Reset Time</dt>
                <dd className="mt-1 text-base text-gray-900">{settings.resetTime} seconds</dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-4">Email Configuration</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Admin Email</dt>
                <dd className="mt-1 text-base text-gray-900">{settings.adminEmail}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Subject</dt>
                <dd className="mt-1 text-base text-gray-900">{settings.emailSubject}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">SMTP Server</dt>
                <dd className="mt-1 text-base text-gray-900">{settings.smtpHost}:{settings.smtpPort}</dd>
              </div>
            </dl>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4">Branding</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Company Name</dt>
              <dd className="mt-1 text-base text-gray-900">{settings.companyName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Colors</dt>
              <dd className="mt-1 flex space-x-2">
                <div className="flex items-center">
                  <div
                    className="w-6 h-6 rounded mr-2"
                    style={{ backgroundColor: settings.primaryColor }}
                  />
                  <span className="text-sm">{settings.primaryColor}</span>
                </div>
                <div className="flex items-center">
                  <div
                    className="w-6 h-6 rounded mr-2"
                    style={{ backgroundColor: settings.secondaryColor }}
                  />
                  <span className="text-sm">{settings.secondaryColor}</span>
                </div>
              </dd>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Edit Settings
        </button>
      </div>
    </div>
  );
}