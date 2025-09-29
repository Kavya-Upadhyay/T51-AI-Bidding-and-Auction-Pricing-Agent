import React from 'react';
import { Gavel, Users, Clock, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from './UserProfile';

interface HeaderProps {
  activeAuctions: number;
  totalBidders: number;
  onAuthClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeAuctions, totalBidders, onAuthClick }) => {
  const { user } = useAuth();

  return (
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Gavel size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Premium Auctions</h1>
                <p className="text-blue-100">Live Bidding Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-2 text-blue-100">
                  <Clock size={20} />
                  <span className="text-sm">Active Auctions</span>
                </div>
                <div className="text-2xl font-bold">{activeAuctions}</div>
              </div>

              <div className="text-center">
                <div className="flex items-center gap-2 text-blue-100">
                  <Users size={20} />
                  <span className="text-sm">Active Bidders</span>
                </div>
                <div className="text-2xl font-bold">{totalBidders}</div>
              </div>

              {user ? (
                  <UserProfile />
              ) : (
                  <button
                      onClick={onAuthClick}
                      className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-4 py-2 transition-colors"
                  >
                    <LogIn size={20} />
                    <span className="font-medium">Sign In</span>
                  </button>
              )}
            </div>
          </div>
        </div>
      </header>
  );
};