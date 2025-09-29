import React, { useState } from 'react';
import { User, LogOut, Trophy, Gavel, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const UserProfile: React.FC = () => {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    if (!user) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-4 py-2 transition-colors"
            >
                {user.avatar ? (
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <User size={16} className="text-white" />
                    </div>
                )}
                <div className="text-left">
                    <div className="text-white font-medium">{user.name}</div>
                    <div className="text-blue-100 text-xs">{user.totalBids} bids placed</div>
                </div>
            </button>

            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border z-20">
                        <div className="p-4 border-b">
                            <div className="flex items-center gap-3">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                        <User size={20} className="text-white" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-gray-800">{user.name}</h3>
                                    <p className="text-gray-600 text-sm">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-center mb-1">
                                        <Gavel size={16} className="text-blue-600" />
                                    </div>
                                    <div className="text-lg font-bold text-gray-800">{user.totalBids}</div>
                                    <div className="text-xs text-gray-600">Total Bids</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-center mb-1">
                                        <Trophy size={16} className="text-yellow-600" />
                                    </div>
                                    <div className="text-lg font-bold text-gray-800">{user.wonAuctions}</div>
                                    <div className="text-xs text-gray-600">Won Auctions</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-center mb-1">
                                        <Calendar size={16} className="text-green-600" />
                                    </div>
                                    <div className="text-lg font-bold text-gray-800">
                                        {Math.floor((new Date().getTime() - user.joinedAt.getTime()) / (1000 * 60 * 60 * 24))}
                                    </div>
                                    <div className="text-xs text-gray-600">Days Active</div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    logout();
                                    setShowDropdown(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};