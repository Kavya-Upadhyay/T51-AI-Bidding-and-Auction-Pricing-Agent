// src/components/AIAgentPanel.tsx
import React, { useState } from 'react';
import { AIAgent } from '../types/auction.types';
import { Bot, TrendingUp, DollarSign, Zap, Settings, Activity } from 'lucide-react';

interface AIAgentPanelProps {
  agents: AIAgent[];
  onAgentUpdate?: (agent: AIAgent) => void;
}

export function AIAgentPanel({ agents, onAgentUpdate }: AIAgentPanelProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'reinforcement_learning':
        return 'bg-purple-100 text-purple-800';
      case 'heuristic':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAggressionLevel = (level: number) => {
    if (level >= 0.8) return { label: 'Very High', color: 'text-red-600' };
    if (level >= 0.6) return { label: 'High', color: 'text-orange-600' };
    if (level >= 0.4) return { label: 'Medium', color: 'text-yellow-600' };
    if (level >= 0.2) return { label: 'Low', color: 'text-green-600' };
    return { label: 'Very Low', color: 'text-blue-600' };
  };

  const getBudgetUtilization = (agent: AIAgent) => {
    const utilized = agent.budget - agent.remainingBudget;
    const percentage = (utilized / agent.budget) * 100;
    return { utilized, percentage };
  };

  if (agents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Bot className="w-6 h-6 mr-2" />
          AI Agents
        </h2>
        <div className="text-center py-8 text-gray-500">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No AI agents available</p>
          <p className="text-sm">AI agents will participate in auctions automatically</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <Bot className="w-6 h-6 mr-2" />
        AI Agents ({agents.length})
      </h2>

      <div className="space-y-4">
        {agents.map((agent) => {
          const { utilized, percentage } = getBudgetUtilization(agent);
          const aggression = getAggressionLevel(agent.aggressionLevel);
          const isExpanded = expandedAgent === agent.id;

          return (
            <div
              key={agent.id}
              className={`border rounded-lg transition-all duration-200 ${
                agent.isActive ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${agent.isActive ? 'bg-green-200' : 'bg-gray-200'}`}>
                      <Bot className={`w-5 h-5 ${agent.isActive ? 'text-green-700' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        {agent.name}
                        {agent.isActive && (
                          <span className="ml-2 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            <span className="text-xs text-green-600 font-medium">ACTIVE</span>
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStrategyColor(agent.strategyType)}`}>
                          {agent.strategyType.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`font-medium ${aggression.color}`}>
                          {aggression.label} Aggression
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        ${agent.remainingBudget.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        of ${agent.budget.toLocaleString()}
                      </div>
                    </div>
                    <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <Settings className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Progress bar for budget utilization */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Budget Utilized</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        percentage > 80 ? 'bg-red-500' :
                        percentage > 60 ? 'bg-orange-500' :
                        percentage > 40 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-gray-900">
                        ${agent.totalSpent.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Total Spent</div>
                    </div>

                    <div className="text-center">
                      <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-gray-900">
                        ${agent.valuationCap.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Max Valuation</div>
                    </div>

                    <div className="text-center">
                      <Zap className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-gray-900">
                        {(agent.aggressionLevel * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">Aggression</div>
                    </div>

                    <div className="text-center">
                      <Activity className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-gray-900">
                        {agent.isActive ? 'ON' : 'OFF'}
                      </div>
                      <div className="text-xs text-gray-500">Status</div>
                    </div>
                  </div>

                  {/* Configuration Details */}
                  {Object.keys(agent.config).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Configuration:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(agent.config).map(([key, value]) => (
                          <div key={key} className="bg-white p-2 rounded">
                            <span className="font-medium text-gray-700">{key}: </span>
                            <span className="text-gray-600">{JSON.stringify(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Summary */}
                  <div className="mt-4 p-3 bg-white rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Performance Summary:</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        • Budget efficiency: {((agent.budget - agent.remainingBudget) / agent.budget * 100).toFixed(1)}% utilized
                      </p>
                      <p>
                        • Average spending rate: ${(agent.totalSpent / Math.max(1, agent.budget - agent.remainingBudget) * 100).toFixed(2)} per transaction
                      </p>
                      <p>
                        • Strategy: {agent.strategyType === 'reinforcement_learning' ? 
                          'Uses deep Q-learning for optimal bidding decisions' : 
                          'Uses rule-based heuristic bidding approach'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {agents.filter(a => a.isActive).length}
            </div>
            <div className="text-xs text-gray-500">Active Agents</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              ${agents.reduce((sum, a) => sum + a.remainingBudget, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total Available</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              ${agents.reduce((sum, a) => sum + a.totalSpent, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total Spent</div>
          </div>
        </div>
      </div>
    </div>
  );
}
