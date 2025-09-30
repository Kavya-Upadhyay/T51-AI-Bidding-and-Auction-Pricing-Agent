import React from 'react';
import { Bid } from '../types/auction';
import { Bot, User } from 'lucide-react';

interface BidHistoryProps {
    bids: Bid[];
}

export const BidHistory: React.FC<BidHistoryProps> = ({ bids }) => {
    const sortedBids = [...bids].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="font-semibold text-gray-800 mb-3">Bid History</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
                {sortedBids.length === 0 ? (
                    <p className="text-gray-500 text-sm">No bids yet</p>
                ) : (
                    sortedBids.map((bid) => (
                        <div key={bid.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                {bid.isAI ? (
                                    <Bot size={14} className="text-blue-500" />
                                ) : (
                                    <User size={14} className="text-green-500" />
                                )}
                                <span className="font-medium">{bid.bidderName}</span>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-gray-800">
                                    ${bid.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {bid.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};