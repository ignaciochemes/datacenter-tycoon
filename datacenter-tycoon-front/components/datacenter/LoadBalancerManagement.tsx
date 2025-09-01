'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { Network, Plus, Edit, Trash2, Play, Pause, Activity, TrendingUp, Server } from 'lucide-react';

interface LoadBalancer {
  id: number;
  uuid: string;
  name: string;
  description: string;
  status: string;
  type: string;
  algorithm: string;
  enabled: boolean;
  virtualIp: string;
  virtualPort: number;
  backendServers: string[];
  healthCheckEnabled: boolean;
  healthCheckPath: string;
  healthCheckInterval: number;
  sessionPersistence: boolean;
  sslTermination: boolean;
  compressionEnabled: boolean;
  cacheEnabled: boolean;
  rateLimitEnabled: boolean;
  maxConnections: number;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface LoadBalancerImpact {
  totalLoadBalancers: number;
  activeLoadBalancers: number;
  reliabilityScore: number;
  availabilityImprovement: number;
  performanceScore: number;
  latencyReduction: number;
  throughputIncrease: number;
  loadBalancersByType: { [key: string]: number };
  loadBalancersByAlgorithm: { [key: string]: number };
}

interface LoadBalancerManagementProps {
  datacenterId?: number;
}

export default function LoadBalancerManagement({ datacenterId }: LoadBalancerManagementProps) {
  const [loadBalancers, setLoadBalancers] = useState<LoadBalancer[]>([]);
  const [impact, setImpact] = useState<LoadBalancerImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLoadBalancer, setSelectedLoadBalancer] = useState<LoadBalancer | null>(null);
  const [activeTab, setActiveTab] = useState('loadbalancers');

  const [newLoadBalancer, setNewLoadBalancer] = useState({
    name: '',
    description: '',
    type: 'APPLICATION',
    algorithm: 'ROUND_ROBIN',
    virtualIp: '',
    virtualPort: 80,
    backendServers: '',
    healthCheckEnabled: true,
    healthCheckPath: '/health',
    healthCheckInterval: 30,
    sessionPersistence: false,
    sslTermination: false,
    compressionEnabled: false,
    cacheEnabled: false,
    rateLimitEnabled: false,
    maxConnections: 1000,
    category: 'GENERAL',
    tags: '',
  });

  useEffect(() => {
    fetchLoadBalancers();
    fetchLoadBalancerImpact();
  }, [datacenterId]);

  const fetchLoadBalancers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = datacenterId 
        ? `/api/load-balancers/datacenter/${datacenterId}`
        : '/api/load-balancers';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLoadBalancers(data);
      }
    } catch (error) {
      console.error('Error fetching load balancers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoadBalancerImpact = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = datacenterId
        ? `/api/load-balancers/datacenter/${datacenterId}/impact`
        : '/api/load-balancers/impact';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setImpact(data);
      }
    } catch (error) {
      console.error('Error fetching load balancer impact:', error);
    }
  };

  const handleCreateLoadBalancer = async () => {
    try {
      const token = localStorage.getItem('token');
      const loadBalancerData = {
        ...newLoadBalancer,
        datacenterId: datacenterId || null,
        backendServers: newLoadBalancer.backendServers.split(',').map(server => server.trim()).filter(server => server),
        tags: newLoadBalancer.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };
      
      const response = await fetch('/api/load-balancers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loadBalancerData),
      });
      
      if (response.ok) {
        setIsCreateDialogOpen(false);
        setNewLoadBalancer({
          name: '',
          description: '',
          type: 'APPLICATION',
          algorithm: 'ROUND_ROBIN',
          virtualIp: '',
          virtualPort: 80,
          backendServers: '',
          healthCheckEnabled: true,
          healthCheckPath: '/health',
          healthCheckInterval: 30,
          sessionPersistence: false,
          sslTermination: false,
          compressionEnabled: false,
          cacheEnabled: false,
          rateLimitEnabled: false,
          maxConnections: 1000,
          category: 'GENERAL',
          tags: '',
        });
        fetchLoadBalancers();
        fetchLoadBalancerImpact();
      }
    } catch (error) {
      console.error('Error creating load balancer:', error);
    }
  };

  const handleUpdateLoadBalancer = async () => {
    if (!selectedLoadBalancer) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/load-balancers/${selectedLoadBalancer.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedLoadBalancer),
      });
      
      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedLoadBalancer(null);
        fetchLoadBalancers();
        fetchLoadBalancerImpact();
      }
    } catch (error) {
      console.error('Error updating load balancer:', error);
    }
  };

  const handleToggleLoadBalancer = async (loadBalancer: LoadBalancer) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = loadBalancer.enabled ? 'disable' : 'enable';
      
      const response = await fetch(`/api/load-balancers/${loadBalancer.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        fetchLoadBalancers();
        fetchLoadBalancerImpact();
      }
    } catch (error) {
      console.error('Error toggling load balancer:', error);
    }
  };

  const handleDeleteLoadBalancer = async (loadBalancerId: number) => {
    if (!confirm('Are you sure you want to delete this load balancer?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/load-balancers/${loadBalancerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        fetchLoadBalancers();
        fetchLoadBalancerImpact();
      }
    } catch (error) {
      console.error('Error deleting load balancer:', error);
    }
  };

  const handleHealthCheck = async (loadBalancerId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/load-balancers/${loadBalancerId}/health-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Health check result: ${result.status}`);
      }
    } catch (error) {
      console.error('Error performing health check:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'APPLICATION': return 'bg-blue-100 text-blue-800';
      case 'NETWORK': return 'bg-purple-100 text-purple-800';
      case 'GATEWAY': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'PERFORMANCE': return 'bg-blue-100 text-blue-800';
      case 'AVAILABILITY': return 'bg-green-100 text-green-800';
      case 'SECURITY': return 'bg-red-100 text-red-800';
      case 'MONITORING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Load Balancer Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Load Balancer Management
          </CardTitle>
          <CardDescription>
            Manage load balancers and monitor performance impact
          </CardDescription>
        </CardHeader>
      </Card>

      {impact && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reliability Score</p>
                  <p className="text-2xl font-bold">{impact.reliabilityScore.toFixed(1)}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Load Balancers</p>
                  <p className="text-2xl font-bold">{impact.activeLoadBalancers}</p>
                </div>
                <Server className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Availability Improvement</p>
                  <p className="text-2xl font-bold">{impact.availabilityImprovement.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Latency Reduction</p>
                  <p className="text-2xl font-bold">{impact.latencyReduction.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="loadbalancers">Load Balancers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="loadbalancers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Load Balancers</CardTitle>
                  <CardDescription>
                    Manage your load balancers and traffic distribution
                  </CardDescription>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Load Balancer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Load Balancer</DialogTitle>
                      <DialogDescription>
                        Configure a new load balancer for your datacenter
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Load Balancer Name</Label>
                        <Input
                          id="name"
                          value={newLoadBalancer.name}
                          onChange={(e) => setNewLoadBalancer({ ...newLoadBalancer, name: e.target.value })}
                          placeholder="Enter load balancer name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={newLoadBalancer.type} onValueChange={(value) => setNewLoadBalancer({ ...newLoadBalancer, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="APPLICATION">Application</SelectItem>
                            <SelectItem value="NETWORK">Network</SelectItem>
                            <SelectItem value="GATEWAY">Gateway</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newLoadBalancer.description}
                          onChange={(e) => setNewLoadBalancer({ ...newLoadBalancer, description: e.target.value })}
                          placeholder="Enter load balancer description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="algorithm">Algorithm</Label>
                        <Select value={newLoadBalancer.algorithm} onValueChange={(value) => setNewLoadBalancer({ ...newLoadBalancer, algorithm: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                            <SelectItem value="LEAST_CONNECTIONS">Least Connections</SelectItem>
                            <SelectItem value="WEIGHTED_ROUND_ROBIN">Weighted Round Robin</SelectItem>
                            <SelectItem value="IP_HASH">IP Hash</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={newLoadBalancer.category} onValueChange={(value) => setNewLoadBalancer({ ...newLoadBalancer, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GENERAL">General</SelectItem>
                            <SelectItem value="PERFORMANCE">Performance</SelectItem>
                            <SelectItem value="AVAILABILITY">Availability</SelectItem>
                            <SelectItem value="SECURITY">Security</SelectItem>
                            <SelectItem value="MONITORING">Monitoring</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="virtualIp">Virtual IP</Label>
                        <Input
                          id="virtualIp"
                          value={newLoadBalancer.virtualIp}
                          onChange={(e) => setNewLoadBalancer({ ...newLoadBalancer, virtualIp: e.target.value })}
                          placeholder="192.168.1.100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="virtualPort">Virtual Port</Label>
                        <Input
                          id="virtualPort"
                          type="number"
                          value={newLoadBalancer.virtualPort}
                          onChange={(e) => setNewLoadBalancer({ ...newLoadBalancer, virtualPort: parseInt(e.target.value) || 80 })}
                          min="1"
                          max="65535"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="backendServers">Backend Servers (comma-separated)</Label>
                        <Input
                          id="backendServers"
                          value={newLoadBalancer.backendServers}
                          onChange={(e) => setNewLoadBalancer({ ...newLoadBalancer, backendServers: e.target.value })}
                          placeholder="192.168.1.10:8080, 192.168.1.11:8080"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxConnections">Max Connections</Label>
                        <Input
                          id="maxConnections"
                          type="number"
                          value={newLoadBalancer.maxConnections}
                          onChange={(e) => setNewLoadBalancer({ ...newLoadBalancer, maxConnections: parseInt(e.target.value) || 1000 })}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="healthCheckInterval">Health Check Interval (seconds)</Label>
                        <Input
                          id="healthCheckInterval"
                          type="number"
                          value={newLoadBalancer.healthCheckInterval}
                          onChange={(e) => setNewLoadBalancer({ ...newLoadBalancer, healthCheckInterval: parseInt(e.target.value) || 30 })}
                          min="5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="healthCheckPath">Health Check Path</Label>
                        <Input
                          id="healthCheckPath"
                          value={newLoadBalancer.healthCheckPath}
                          onChange={(e) => setNewLoadBalancer({ ...newLoadBalancer, healthCheckPath: e.target.value })}
                          placeholder="/health"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          value={newLoadBalancer.tags}
                          onChange={(e) => setNewLoadBalancer({ ...newLoadBalancer, tags: e.target.value })}
                          placeholder="web, api, critical"
                        />
                      </div>
                      <div className="col-span-2 grid grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="healthCheckEnabled"
                            checked={newLoadBalancer.healthCheckEnabled}
                            onCheckedChange={(checked) => setNewLoadBalancer({ ...newLoadBalancer, healthCheckEnabled: !!checked })}
                          />
                          <Label htmlFor="healthCheckEnabled">Health Check Enabled</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sessionPersistence"
                            checked={newLoadBalancer.sessionPersistence}
                            onCheckedChange={(checked) => setNewLoadBalancer({ ...newLoadBalancer, sessionPersistence: !!checked })}
                          />
                          <Label htmlFor="sessionPersistence">Session Persistence</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sslTermination"
                            checked={newLoadBalancer.sslTermination}
                            onCheckedChange={(checked) => setNewLoadBalancer({ ...newLoadBalancer, sslTermination: !!checked })}
                          />
                          <Label htmlFor="sslTermination">SSL Termination</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="compressionEnabled"
                            checked={newLoadBalancer.compressionEnabled}
                            onCheckedChange={(checked) => setNewLoadBalancer({ ...newLoadBalancer, compressionEnabled: !!checked })}
                          />
                          <Label htmlFor="compressionEnabled">Compression</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="cacheEnabled"
                            checked={newLoadBalancer.cacheEnabled}
                            onCheckedChange={(checked) => setNewLoadBalancer({ ...newLoadBalancer, cacheEnabled: !!checked })}
                          />
                          <Label htmlFor="cacheEnabled">Cache</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="rateLimitEnabled"
                            checked={newLoadBalancer.rateLimitEnabled}
                            onCheckedChange={(checked) => setNewLoadBalancer({ ...newLoadBalancer, rateLimitEnabled: !!checked })}
                          />
                          <Label htmlFor="rateLimitEnabled">Rate Limiting</Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateLoadBalancer}>
                        Create Load Balancer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Virtual IP:Port</TableHead>
                    <TableHead>Algorithm</TableHead>
                    <TableHead>Backend Servers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadBalancers.map((lb) => (
                    <TableRow key={lb.id}>
                      <TableCell className="font-medium">{lb.name}</TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeColor(lb.type)}>
                          {lb.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {lb.virtualIp}:{lb.virtualPort}
                        </div>
                      </TableCell>
                      <TableCell>{lb.algorithm}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {lb.backendServers.length} servers
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(lb.status)}>
                          {lb.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadgeColor(lb.category)}>
                          {lb.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleLoadBalancer(lb)}
                          >
                            {lb.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleHealthCheck(lb.id)}
                          >
                            <Activity className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLoadBalancer(lb);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLoadBalancer(lb.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          {impact && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Load Balancers by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(impact.loadBalancersByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <Badge className={getTypeBadgeColor(type)}>
                          {type}
                        </Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Load Balancers by Algorithm</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(impact.loadBalancersByAlgorithm).map(([algorithm, count]) => (
                      <div key={algorithm} className="flex items-center justify-between">
                        <Badge variant="outline">
                          {algorithm.replace('_', ' ')}
                        </Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{impact.performanceScore.toFixed(1)}</p>
                      <p className="text-sm text-gray-600">Performance Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{impact.availabilityImprovement.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Availability Improvement</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{impact.latencyReduction.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Latency Reduction</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{impact.throughputIncrease.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Throughput Increase</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Load Balancer</DialogTitle>
            <DialogDescription>
              Modify the load balancer configuration
            </DialogDescription>
          </DialogHeader>
          {selectedLoadBalancer && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Load Balancer Name</Label>
                <Input
                  id="edit-name"
                  value={selectedLoadBalancer.name}
                  onChange={(e) => setSelectedLoadBalancer({ ...selectedLoadBalancer, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-algorithm">Algorithm</Label>
                <Select value={selectedLoadBalancer.algorithm} onValueChange={(value) => setSelectedLoadBalancer({ ...selectedLoadBalancer, algorithm: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                    <SelectItem value="LEAST_CONNECTIONS">Least Connections</SelectItem>
                    <SelectItem value="WEIGHTED_ROUND_ROBIN">Weighted Round Robin</SelectItem>
                    <SelectItem value="IP_HASH">IP Hash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedLoadBalancer.description}
                  onChange={(e) => setSelectedLoadBalancer({ ...selectedLoadBalancer, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxConnections">Max Connections</Label>
                <Input
                  id="edit-maxConnections"
                  type="number"
                  value={selectedLoadBalancer.maxConnections}
                  onChange={(e) => setSelectedLoadBalancer({ ...selectedLoadBalancer, maxConnections: parseInt(e.target.value) || 1000 })}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-healthCheckInterval">Health Check Interval</Label>
                <Input
                  id="edit-healthCheckInterval"
                  type="number"
                  value={selectedLoadBalancer.healthCheckInterval}
                  onChange={(e) => setSelectedLoadBalancer({ ...selectedLoadBalancer, healthCheckInterval: parseInt(e.target.value) || 30 })}
                  min="5"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLoadBalancer}>
              Update Load Balancer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}