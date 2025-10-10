// src/App.tsx
import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AuthWrapper } from './components/AuthWrapper';
import { AuctionDashboard } from './components/AuctionDashboard';
import { AuctionCreator } from './components/AuctionCreator';
import { AuctionRoom } from './components/AuctionRoom';
import { AIAgentPanel } from './components/AIAgentPanel';
import { useAuction } from './hooks/useAuction';
import { useAuth } from './contexts/AuthContext';
import { Auction } from './types/auction.types';
import { Gavel, LogOut } from 'lucide-react';

function AuctionApp() {
  const { profile, signOut } = useAuth();
  const { aiAgents } = useAuction();
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Gavel className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI Auction Platform</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{profile?.display_name}</span>
              </div>
              <div className="text-sm font-medium text-green-600">
                Balance: ${profile?.balance.toFixed(2)}
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Auctions */}
          <div className="lg:col-span-2 space-y-6">
            <AuctionCreator />
            <AuctionDashboard onSelectAuction={setSelectedAuction} />
          </div>

          {/* Right Column - AI Agents */}
          <div>
            <AIAgentPanel agents={aiAgents} />
          </div>
        </div>
      </main>

      {/* Auction Room Modal */}
      {selectedAuction && (
        <AuctionRoom
          auction={selectedAuction}
          onClose={() => setSelectedAuction(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthWrapper>
        <AuctionApp />
      </AuthWrapper>
    </AuthProvider>
  );
}