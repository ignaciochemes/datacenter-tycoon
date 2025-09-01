'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Server, Zap, Thermometer } from 'lucide-react'

interface Device {
  id: string
  name: string
  type: string
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR'
  powerConsumptionKW: number
  heatOutputKW: number
  startUnit: number
  endUnit: number
  rackId?: string
}

interface Rack {
  id: string
  name: string
  location: string
  maxUnits: number
  devices: Device[]
}

export function RackVisualization() {
  const [racks, setRacks] = useState<Rack[]>([])
  const [selectedRack, setSelectedRack] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRacksAndDevices()
  }, [])

  const fetchRacksAndDevices = async () => {
    try {
      setLoading(true)
      const [racksResponse, devicesResponse] = await Promise.all([
        fetch('http://localhost:33000/ms-dtct-api/api/racks', {
          headers: {
            'Authorization': 'Bearer demo-token'
          }
        }),
        fetch('http://localhost:33000/ms-dtct-api/api/devices', {
          headers: {
            'Authorization': 'Bearer demo-token'
          }
        })
      ])
      
      let racksData = []
      let devicesData = []
      
      if (racksResponse.ok) {
        racksData = await racksResponse.json()
        racksData = Array.isArray(racksData) ? racksData : []
      }
      
      if (devicesResponse.ok) {
        devicesData = await devicesResponse.json()
        devicesData = Array.isArray(devicesData) ? devicesData : []
      }
      
      const racksWithDevices = racksData.map((rack: any) => ({
        ...rack,
        devices: devicesData.filter((device: Device) => device.rackId === rack.id)
      }))
      
      setRacks(racksWithDevices)
      if (racksWithDevices.length > 0 && !selectedRack) {
        setSelectedRack(racksWithDevices[0].id)
      }
    } catch (error) {
      console.error('Error fetching racks and devices:', error)
      setRacks([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-500'
      case 'OFFLINE': return 'bg-gray-400'
      case 'MAINTENANCE': return 'bg-yellow-500'
      case 'ERROR': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  const renderRackUnits = (rack: Rack) => {
    const units = Array.from({ length: rack.maxUnits }, (_, i) => i + 1).reverse()
    const occupiedUnits = new Set()
    
    rack.devices.forEach(device => {
      for (let u = device.startUnit; u <= device.endUnit; u++) {
        occupiedUnits.add(u)
      }
    })

    return (
      <div className="grid grid-cols-1 gap-1 p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
        <div className="text-center font-semibold text-sm mb-2 text-gray-700">
          {rack.name}
        </div>
        {units.map(unit => {
          const device = rack.devices.find(d => 
            unit >= d.startUnit && unit <= d.endUnit
          )
          
          const isOccupied = occupiedUnits.has(unit)
          const isDeviceStart = device && unit === device.startUnit
          
          return (
            <div
              key={unit}
              className={`
                h-8 border border-gray-300 flex items-center justify-between px-2 text-xs
                ${isOccupied 
                  ? `${getStatusColor(device?.status || '')} text-white` 
                  : 'bg-white text-gray-400'
                }
                ${isDeviceStart ? 'font-semibold' : ''}
              `}
              title={device ? `${device.name} (${device.type})` : `Unit ${unit} - Available`}
            >
              <span className="font-mono text-xs">{unit.toString().padStart(2, '0')}</span>
              {isDeviceStart && (
                <span className="truncate ml-2 flex-1 text-right">
                  {device.name}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const selectedRackData = racks.find(r => r.id === selectedRack)
  const rackStats = selectedRackData ? {
    totalDevices: selectedRackData.devices.length,
    occupiedUnits: selectedRackData.devices.reduce((sum, d) => sum + (d.endUnit - d.startUnit + 1), 0),
    totalPower: selectedRackData.devices.reduce((sum, d) => sum + d.powerConsumptionKW, 0),
    totalHeat: selectedRackData.devices.reduce((sum, d) => sum + d.heatOutputKW, 0),
    utilization: selectedRackData.devices.reduce((sum, d) => sum + (d.endUnit - d.startUnit + 1), 0) / selectedRackData.maxUnits * 100
  } : null

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rack Visualization</CardTitle>
          <CardDescription>Loading rack data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (racks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rack Visualization</CardTitle>
          <CardDescription>No racks found in your datacenter</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Create racks to visualize your datacenter layout.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rack Visualization</CardTitle>
          <CardDescription>
            Visual representation of your datacenter racks and device placement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={selectedRack} onValueChange={setSelectedRack}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select a rack" />
              </SelectTrigger>
              <SelectContent>
                {racks.map(rack => (
                  <SelectItem key={rack.id} value={rack.id}>
                    {rack.name} - {rack.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRackData && rackStats && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Devices</p>
                          <p className="text-2xl font-bold">{rackStats.totalDevices}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded" />
                        <div>
                          <p className="text-sm font-medium">Utilization</p>
                          <p className="text-2xl font-bold">{rackStats.utilization.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Power</p>
                          <p className="text-2xl font-bold">{rackStats.totalPower.toFixed(1)} kW</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Heat</p>
                          <p className="text-2xl font-bold">{rackStats.totalHeat.toFixed(1)} kW</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status Legend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded" />
                        <span className="text-sm">Online</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-400 rounded" />
                        <span className="text-sm">Offline</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded" />
                        <span className="text-sm">Maintenance</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded" />
                        <span className="text-sm">Error</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-center">
                {renderRackUnits(selectedRackData)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}