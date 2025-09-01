'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Server, Zap, Thermometer, Activity, Plus } from 'lucide-react'
import { DeviceInventory } from './DeviceInventory'
import { RackVisualization } from './RackVisualization'
import { AddDeviceDialog } from './AddDeviceDialog'
import { ContractsManagement } from './ContractsManagement'

interface DatacenterStats {
  totalDevices: number
  activeDevices: number
  totalPowerConsumption: number
  averageTemperature: number
  rackUtilization: number
}

export function DatacenterDashboard() {
  const [stats, setStats] = useState<DatacenterStats>({
    totalDevices: 0,
    activeDevices: 0,
    totalPowerConsumption: 0,
    averageTemperature: 0,
    rackUtilization: 0
  })
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false)

  useEffect(() => {
    fetchDatacenterStats()
  }, [])

  const fetchDatacenterStats = async () => {
    try {
      const response = await fetch('http://localhost:33000/ms-dtct-api/api/devices', {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      if (response.ok) {
        const devices = await response.json()
        const devicesArray = Array.isArray(devices) ? devices : []
        
        const totalDevices = devicesArray.length
        const activeDevices = devicesArray.filter((d: any) => d.status === 'ONLINE').length
        const totalPowerConsumption = devicesArray.reduce((sum: number, d: any) => sum + (d.powerConsumptionKW || 0), 0)
        const averageTemperature = devicesArray.reduce((sum: number, d: any) => sum + (d.heatOutputKW || 0), 0) / totalDevices || 0
        
        setStats({
          totalDevices,
          activeDevices,
          totalPowerConsumption,
          averageTemperature,
          rackUtilization: totalDevices > 0 ? (activeDevices / totalDevices) * 100 : 0
        })
      } else {
        setStats({
          totalDevices: 0,
          activeDevices: 0,
          totalPowerConsumption: 0,
          averageTemperature: 0,
          rackUtilization: 0
        })
      }
    } catch (error) {
      console.error('Error fetching datacenter stats:', error)
      setStats({
        totalDevices: 0,
        activeDevices: 0,
        totalPowerConsumption: 0,
        averageTemperature: 0,
        rackUtilization: 0
      })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Datacenter Management</h1>
          <p className="text-muted-foreground">Monitor and manage your datacenter infrastructure</p>
        </div>
        <Button onClick={() => setIsAddDeviceOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Device
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeDevices} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Power Consumption</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPowerConsumption.toFixed(1)} kW</div>
            <p className="text-xs text-muted-foreground">
              Total power draw
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heat Output</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageTemperature.toFixed(1)} kW</div>
            <p className="text-xs text-muted-foreground">
              Average heat output
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rack Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rackUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Capacity utilization
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Device Inventory</TabsTrigger>
          <TabsTrigger value="racks">Rack Visualization</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-4">
          <DeviceInventory onDeviceUpdate={fetchDatacenterStats} />
        </TabsContent>
        
        <TabsContent value="racks" className="space-y-4">
          <RackVisualization />
        </TabsContent>
        
        <TabsContent value="contracts" className="space-y-4">
          <ContractsManagement />
        </TabsContent>
      </Tabs>

      <AddDeviceDialog 
        open={isAddDeviceOpen} 
        onOpenChange={setIsAddDeviceOpen}
        onDeviceAdded={fetchDatacenterStats}
      />
    </div>
  )
}