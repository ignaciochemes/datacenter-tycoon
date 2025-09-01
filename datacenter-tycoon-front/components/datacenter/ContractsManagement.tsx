'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, DollarSign, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react'

interface Contract {
  id: number
  npc: {
    id: number
    name: string
    tier: string
  }
  service: {
    id: number
    name: string
    type: string
  }
  monthlyPrice: number
  status: string
  startDate: string
  endDate: string
  slaMetrics: {
    uptimePercentage: number
    responseTimeMs: number
    throughputMbps: number
  }
  slaRequirements: {
    minUptimePercentage: number
    maxResponseTimeMs: number
    minThroughputMbps: number
  }
  penaltyAmount: number
  createdAt: string
}

interface ContractStats {
  totalContracts: number
  activeContracts: number
  totalMonthlyRevenue: number
  totalPenalties: number
  averageUptime: number
}

export function ContractsManagement() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [stats, setStats] = useState<ContractStats>({
    totalContracts: 0,
    activeContracts: 0,
    totalMonthlyRevenue: 0,
    totalPenalties: 0,
    averageUptime: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContracts()
    fetchContractStats()
  }, [])

  const fetchContracts = async () => {
    try {
      const response = await fetch('http://localhost:33000/ms-dtct-api/api/contracts/user/1', {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      if (response.ok) {
        const data = await response.json()
        const contractsArray = Array.isArray(data.contracts) ? data.contracts : []
        
        const formattedContracts = contractsArray.map((contract: any) => ({
          id: contract.id,
          npc: {
            id: contract.clientId?.id || 0,
            name: contract.clientId?.username || 'Unknown Client',
            tier: 'Enterprise'
          },
          service: {
            id: contract.serviceId?.id || 0,
            name: contract.serviceId?.name || 'Unknown Service',
            type: contract.serviceId?.type || 'hosting'
          },
          monthlyPrice: contract.monthlyPrice || 0,
          status: contract.status || 'active',
          startDate: contract.startDate || new Date().toISOString(),
          endDate: contract.endDate || new Date().toISOString(),
          slaMetrics: {
            uptimePercentage: contract.currentPeriodUptimePercent || 100,
            responseTimeMs: contract.currentPeriodAvgLatencyMs || 0,
            throughputMbps: contract.currentPeriodAvgThroughputMbps || 0
          },
          slaRequirements: {
            minUptimePercentage: contract.guaranteedUptimePercent || 99.9,
            maxResponseTimeMs: contract.maxLatencyMs || 100,
            minThroughputMbps: contract.minThroughputMbps || 100
          },
          penaltyAmount: contract.currentPeriodPenalties || 0,
          createdAt: contract.createdAt || new Date().toISOString()
        }))
        
        setContracts(formattedContracts)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchContractStats = async () => {
    try {
      const response = await fetch('http://localhost:33000/ms-dtct-api/api/contracts/stats', {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalContracts: data.totalContracts || 0,
          activeContracts: data.activeContracts || 0,
          monthlyRevenue: data.monthlyRevenue || 0,
          totalPenalties: data.totalPenalties || 0,
          averageUptime: data.averageUptime || 100
        })
      }
    } catch (error) {
      console.error('Error fetching contract stats:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'expired':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTierBadge = (tier: string) => {
    const colors = {
      startup: 'bg-blue-500',
      sme: 'bg-green-500',
      enterprise: 'bg-purple-500',
      government: 'bg-red-500'
    }
    return (
      <Badge className={colors[tier.toLowerCase() as keyof typeof colors] || 'bg-gray-500'}>
        {tier.toUpperCase()}
      </Badge>
    )
  }

  const calculateSLACompliance = (contract: Contract) => {
    const uptimeCompliance = contract.slaMetrics.uptimePercentage >= contract.slaRequirements.minUptimePercentage
    const responseTimeCompliance = contract.slaMetrics.responseTimeMs <= contract.slaRequirements.maxResponseTimeMs
    const throughputCompliance = contract.slaMetrics.throughputMbps >= contract.slaRequirements.minThroughputMbps
    
    const compliantMetrics = [uptimeCompliance, responseTimeCompliance, throughputCompliance].filter(Boolean).length
    return (compliantMetrics / 3) * 100
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading contracts...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContracts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeContracts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalMonthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From active contracts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penalties</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalPenalties)}</div>
            <p className="text-xs text-muted-foreground">
              SLA violations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageUptime.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all contracts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Tiers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(contracts.map(c => c.npc.tier)).size}</div>
            <p className="text-xs text-muted-foreground">
              Different client types
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Contracts</TabsTrigger>
          <TabsTrigger value="all">All Contracts</TabsTrigger>
          <TabsTrigger value="sla">SLA Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Contracts</CardTitle>
              <CardDescription>
                Currently running service contracts with clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Monthly Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>SLA Compliance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.filter(c => c.status.toLowerCase() === 'active').map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{contract.npc.name}</span>
                          {getTierBadge(contract.npc.tier)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{contract.service.name}</span>
                          <span className="text-sm text-muted-foreground">{contract.service.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(contract.monthlyPrice)}</TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell>{formatDate(contract.endDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium">{calculateSLACompliance(contract).toFixed(1)}%</div>
                          {contract.penaltyAmount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              -{formatCurrency(contract.penaltyAmount)}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Contracts</CardTitle>
              <CardDescription>
                Complete history of service contracts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Monthly Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{contract.npc.name}</span>
                          {getTierBadge(contract.npc.tier)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{contract.service.name}</span>
                          <span className="text-sm text-muted-foreground">{contract.service.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(contract.monthlyPrice)}</TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell>{formatDate(contract.startDate)}</TableCell>
                      <TableCell>{formatDate(contract.endDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sla" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SLA Performance</CardTitle>
              <CardDescription>
                Service Level Agreement metrics and compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Throughput</TableHead>
                    <TableHead>Penalties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.filter(c => c.status.toLowerCase() === 'active').map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{contract.npc.name}</span>
                          {getTierBadge(contract.npc.tier)}
                        </div>
                      </TableCell>
                      <TableCell>{contract.service.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={`font-medium ${
                            contract.slaMetrics.uptimePercentage >= contract.slaRequirements.minUptimePercentage 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {contract.slaMetrics.uptimePercentage.toFixed(2)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Required: {contract.slaRequirements.minUptimePercentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={`font-medium ${
                            contract.slaMetrics.responseTimeMs <= contract.slaRequirements.maxResponseTimeMs 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {contract.slaMetrics.responseTimeMs}ms
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Max: {contract.slaRequirements.maxResponseTimeMs}ms
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={`font-medium ${
                            contract.slaMetrics.throughputMbps >= contract.slaRequirements.minThroughputMbps 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {contract.slaMetrics.throughputMbps} Mbps
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Min: {contract.slaRequirements.minThroughputMbps} Mbps
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contract.penaltyAmount > 0 ? (
                          <Badge variant="destructive">
                            {formatCurrency(contract.penaltyAmount)}
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500">
                            No Penalties
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}