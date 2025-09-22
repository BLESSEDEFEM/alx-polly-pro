"use client"

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, PieChart as PieChartIcon, Users, Percent } from 'lucide-react'
import { Poll, PollOption } from '@/types'

interface PollResultsChartProps {
  poll: Poll
  className?: string
}

interface ChartData {
  name: string
  votes: number
  percentage: number
  color: string
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#ec4899', // pink
  '#6b7280', // gray
]

export function PollResultsChart({ poll, className }: PollResultsChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')

  const totalVotes = poll.options?.reduce((sum, option) => sum + (option.votes?.length || 0), 0) || 0

  const chartData: ChartData[] = poll.options?.map((option, index) => ({
    name: option.text.length > 20 ? `${option.text.substring(0, 20)}...` : option.text,
    votes: option.votes?.length || 0,
    percentage: totalVotes > 0 ? Math.round(((option.votes?.length || 0) / totalVotes) * 100) : 0,
    color: COLORS[index % COLORS.length]
  })) || []

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            Votes: {data.votes} ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-blue-600">
            Votes: {data.votes} ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Poll Results</span>
            </CardTitle>
            <CardDescription className="flex items-center space-x-4 mt-2">
              <span className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{totalVotes} total votes</span>
              </span>
              {poll.options && poll.options.length > 0 && (
                <span className="flex items-center space-x-1">
                  <Percent className="h-4 w-4" />
                  <span>{poll.options.length} options</span>
                </span>
              )}
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="flex items-center space-x-1"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Bar</span>
            </Button>
            <Button
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('pie')}
              className="flex items-center space-x-1"
            >
              <PieChartIcon className="h-4 w-4" />
              <span>Pie</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {totalVotes === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No votes yet</p>
            <p className="text-sm">Be the first to vote on this poll!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="votes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }) => `${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="votes"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Results Summary */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Detailed Results</h4>
              {chartData
                .sort((a, b) => b.votes - a.votes)
                .map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                      <span className="font-medium text-sm">{option.name}</span>
                      {index === 0 && option.votes > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Leading
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{option.votes} votes</span>
                      <span>({option.percentage}%)</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}