'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AddDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeviceAdded: () => void
}

interface HardwareItem {
  id: string
  name: string
  type: string
  manufacturer: string
  powerConsumption: number
  heatOutput: number
  specifications: any
}

interface Rack {
  id: string
  name: string
  location: string
  maxUnits: number
}

export function AddDeviceDialog({ open, onOpenChange, onDeviceAdded }: AddDeviceDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    hardwareItemId: '',
    rackId: '',
    startUnit: '',
    ipAddress: '',
    description: ''
  })
  const [hardwareItems, setHardwareItems] = useState<HardwareItem[]>([])
  const [racks, setRacks] = useState<Rack[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedHardware, setSelectedHardware] = useState<HardwareItem | null>(null)

  useEffect(() => {
    if (open) {
      fetchHardwareItems()
      fetchRacks()
    }
  }, [open])

  useEffect(() => {
    if (formData.hardwareItemId) {
      const hardware = hardwareItems.find(h => h.id === formData.hardwareItemId)
      setSelectedHardware(hardware || null)
    } else {
      setSelectedHardware(null)
    }
  }, [formData.hardwareItemId, hardwareItems])

  const fetchHardwareItems = async () => {
    try {
      const response = await fetch('http://localhost:33000/ms-dtct-api/api/hardware-seeding', {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setHardwareItems(Array.isArray(data) ? data : [])
      } else {
        setHardwareItems([])
      }
    } catch (error) {
      console.error('Error fetching hardware items:', error)
      setHardwareItems([])
    }
  }

  const fetchRacks = async () => {
    try {
      const response = await fetch('http://localhost:33000/ms-dtct-api/api/racks', {
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRacks(Array.isArray(data) ? data : [])
      } else {
        setRacks([])
      }
    } catch (error) {
      console.error('Error fetching racks:', error)
      setRacks([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedHardware) {
      alert('Please select a hardware item')
      return
    }

    setLoading(true)
    
    try {
      const deviceData = {
        name: formData.name,
        type: selectedHardware.type,
        powerConsumptionKW: selectedHardware.powerConsumption,
        heatOutputKW: selectedHardware.heatOutput,
        startUnit: parseInt(formData.startUnit),
        endUnit: parseInt(formData.startUnit) + 1, // Assuming 1U devices for now
        rackId: formData.rackId || null,
        ipAddress: formData.ipAddress || null,
        description: formData.description || JSON.stringify(selectedHardware.specifications),
        status: 'OFFLINE',
        purchaseDate: new Date().toISOString().split('T')[0]
      }

      const response = await fetch('http://localhost:33000/ms-dtct-api/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify(deviceData)
      })

      if (response.ok) {
        onDeviceAdded()
        onOpenChange(false)
        resetForm()
      } else {
        const error = await response.text()
        console.error('Failed to create device:', error)
        alert('Failed to create device. Please try again.')
      }
    } catch (error) {
      console.error('Error creating device:', error)
      alert('Error creating device. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      hardwareItemId: '',
      rackId: '',
      startUnit: '',
      ipAddress: '',
      description: ''
    })
    setSelectedHardware(null)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
          <DialogDescription>
            Add a new device to your datacenter inventory
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Device Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter device name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hardware">Hardware Type</Label>
              <Select value={formData.hardwareItemId} onValueChange={(value) => handleInputChange('hardwareItemId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hardware" />
                </SelectTrigger>
                <SelectContent>
                  {hardwareItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedHardware && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Hardware Specifications</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Manufacturer: {selectedHardware.manufacturer}</div>
                <div>Type: {selectedHardware.type}</div>
                <div>Power: {selectedHardware.powerConsumption} kW</div>
                <div>Heat Output: {selectedHardware.heatOutput} kW</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rack">Rack Assignment</Label>
              <Select value={formData.rackId} onValueChange={(value) => handleInputChange('rackId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rack (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No rack assignment</SelectItem>
                  {racks.map(rack => (
                    <SelectItem key={rack.id} value={rack.id}>
                      {rack.name} - {rack.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startUnit">Start Unit (U)</Label>
              <Input
                id="startUnit"
                type="number"
                min="1"
                max="42"
                value={formData.startUnit}
                onChange={(e) => handleInputChange('startUnit', e.target.value)}
                placeholder="1"
                required={!!formData.rackId}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ipAddress">IP Address</Label>
            <Input
              id="ipAddress"
              value={formData.ipAddress}
              onChange={(e) => handleInputChange('ipAddress', e.target.value)}
              placeholder="192.168.1.100 (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional notes or specifications"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Device'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}