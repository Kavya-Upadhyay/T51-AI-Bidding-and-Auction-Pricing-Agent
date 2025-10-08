import React from 'react';
import { AIAgent } from '../types/auction';
import { Bot, TrendingUp, DollarSign, Zap } from 'lucide-react';

interface AIAgentPanelProps {
  agents: AIAgent[];
}

export function AIAgentPanel({ agents }: AIAgentPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Bot className="w-6 h-6 text-blue-500" />
        AI Bidding Agents
      </h2>

      <div className="space-y-4">
        {agents.map(agent => (
          <div
            key={agent.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  {agent.name}
                  {agent.isActive && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Active
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500 capitalize mt-1">
                  {agent.strategyType.replace('_', ' ')} Strategy
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <DollarSign className="w-3 h-3" />
                  Budget
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  ${agent.remainingBudget.toFixed(2)} / ${agent.budget.toFixed(2)}
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all"
                    style={{ width: `${(agent.remainingBudget / agent.budget) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <TrendingUp className="w-3 h-3" />
                  Max Valuation
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  ${agent.valuationCap.toFixed(2)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Zap className="w-3 h-3" />
                  Aggression
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {(agent.aggressionLevel * 100).toFixed(0)}%
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full transition-all"
                    style={{ width: `${agent.aggressionLevel * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">Total Spent</div>
                <div className="text-sm font-semibold text-gray-900">
                  ${agent.totalSpent.toFixed(2)}
                </div>
              </div>
            </div>

            {agent.strategyType === 'heuristic' && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Heuristic Config: Min Wait {agent.config.min_wait_time}s • Max Bid Ratio {(agent.config.max_bid_ratio * 100).toFixed(0)}%
                </div>
              </div>
            )}

            {agent.strategyType === 'reinforcement_learning' && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  RL Config: ε={agent.config.epsilon} • α={agent.config.learning_rate} • γ={agent.config.discount_factor}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2 text-sm">About AI Strategies</h4>
        <div className="text-xs text-blue-800 space-y-2">
          <p>
            <strong>Heuristic:</strong> Uses rule-based bidding with configurable aggression and timing
          </p>
          <p>
            <strong>Reinforcement Learning:</strong> Learns optimal bidding through experience using Q-learning
          </p>
        </div>
      </div>
    </div>
  );
}
