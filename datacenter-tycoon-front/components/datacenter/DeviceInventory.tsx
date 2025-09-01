'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Edit, Trash2 } from 'lucide-react'

interface Device {
  id: string
  name: string
  type: string
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR'
  powerConsumptionKW: number
  heatOutputKW: number
  ipAddress?: string
  rackId?: string
  startUnit: number
  endUnit: number
  description?: string
  purchaseDate?: string
  warrantyExpiry?: string
}

interface DeviceInventoryProps {
  onDeviceUpdate: () => void
}

export function DeviceInventory({ onDeviceUpdate }: DeviceInventoryProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDevices()
  }, [])

  useEffect(() => {
    filterDevices()
  }, [devices, searchTerm, statusFilter, typeFilter])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:33000/ms-dtct-api/api/devices', {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDevices(Array.isArray(data) ? data : [])
      } else {
        setDevices([])
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
      setDevices([])
    } finally {
      setLoading(false)
    }
  }

  const filterDevices = () => {
    let filtered = devices

    if (searchTerm) {
      filtered = filtered.filter(device => 
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(device => device.type === typeFilter)
    }

    setFilteredDevices(filtered)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'success'
      case 'OFFLINE': return 'secondary'
      case 'MAINTENANCE': return 'warning'
      case 'ERROR': return 'destructive'
      default: return 'secondary'
    }
  }

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return

    try {
      const response = await fetch(`http://localhost:33000/api/devices/${deviceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchDevices()
        onDeviceUpdate()
      } else {
        console.error('Failed to delete device')
      }
    } catch (error) {
      console.error('Error deleting device:', error)
    }
  }

  const uniqueTypes = [...new Set(devices.map(d => d.type))]
  const uniqueStatuses = ['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR']

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Inventory</CardTitle>
          <CardDescription>Loading devices...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Inventory</CardTitle>
        <CardDescription>
          Manage all devices in your datacenter ({filteredDevices.length} of {devices.length} devices)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {uniqueStatuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Power (kW)</TableHead>
                <TableHead>Heat (kW)</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Rack Position</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No devices found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>{device.type}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(device.status)}>
                        {device.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{device.powerConsumptionKW?.toFixed(1) || '0.0'}</TableCell>
                    <TableCell>{device.heatOutputKW?.toFixed(1) || '0.0'}</TableCell>
                    <TableCell>{device.ipAddress || 'N/A'}</TableCell>
                    <TableCell>
                      {device.rackId ? `Rack ${device.rackId}, U${device.startUnit}-${device.endUnit}` : 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteDevice(device.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}