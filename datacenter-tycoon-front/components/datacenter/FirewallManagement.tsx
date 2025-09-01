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
import { Shield, Plus, Edit, Trash2, Play, Pause, AlertTriangle, CheckCircle } from 'lucide-react';

interface FirewallRule {
  id: number;
  uuid: string;
  name: string;
  description: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: string;
  destinationPort: string;
  protocol: string;
  action: string;
  priority: number;
  enabled: boolean;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface SecurityImpact {
  totalRules: number;
  activeRules: number;
  securityScore: number;
  availabilityImpact: number;
  performanceImpact: number;
  rulesByCategory: { [key: string]: number };
  rulesByAction: { [key: string]: number };
}

interface FirewallManagementProps {
  datacenterId?: number;
}

export default function FirewallManagement({ datacenterId }: FirewallManagementProps) {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [securityImpact, setSecurityImpact] = useState<SecurityImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<FirewallRule | null>(null);
  const [activeTab, setActiveTab] = useState('rules');

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    sourceIp: '',
    destinationIp: '',
    sourcePort: '',
    destinationPort: '',
    protocol: 'TCP',
    action: 'ALLOW',
    priority: 100,
    category: 'GENERAL',
    tags: '',
  });

  useEffect(() => {
    fetchFirewallRules();
    fetchSecurityImpact();
  }, [datacenterId]);

  const fetchFirewallRules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = datacenterId 
        ? `/api/firewall-rules/datacenter/${datacenterId}`
        : '/api/firewall-rules';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Error fetching firewall rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityImpact = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = datacenterId
        ? `/api/firewall-rules/datacenter/${datacenterId}/impact`
        : '/api/firewall-rules/impact';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSecurityImpact(data);
      }
    } catch (error) {
      console.error('Error fetching security impact:', error);
    }
  };

  const handleCreateRule = async () => {
    try {
      const token = localStorage.getItem('token');
      const ruleData = {
        ...newRule,
        datacenterId: datacenterId || null,
        tags: newRule.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };
      
      const response = await fetch('/api/firewall-rules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });
      
      if (response.ok) {
        setIsCreateDialogOpen(false);
        setNewRule({
          name: '',
          description: '',
          sourceIp: '',
          destinationIp: '',
          sourcePort: '',
          destinationPort: '',
          protocol: 'TCP',
          action: 'ALLOW',
          priority: 100,
          category: 'GENERAL',
          tags: '',
        });
        fetchFirewallRules();
        fetchSecurityImpact();
      }
    } catch (error) {
      console.error('Error creating firewall rule:', error);
    }
  };

  const handleUpdateRule = async () => {
    if (!selectedRule) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/firewall-rules/${selectedRule.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedRule),
      });
      
      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedRule(null);
        fetchFirewallRules();
        fetchSecurityImpact();
      }
    } catch (error) {
      console.error('Error updating firewall rule:', error);
    }
  };

  const handleToggleRule = async (rule: FirewallRule) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = rule.enabled ? 'disable' : 'enable';
      
      const response = await fetch(`/api/firewall-rules/${rule.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        fetchFirewallRules();
        fetchSecurityImpact();
      }
    } catch (error) {
      console.error('Error toggling firewall rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('Are you sure you want to delete this firewall rule?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/firewall-rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        fetchFirewallRules();
        fetchSecurityImpact();
      }
    } catch (error) {
      console.error('Error deleting firewall rule:', error);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'ALLOW': return 'bg-green-100 text-green-800';
      case 'DENY': return 'bg-red-100 text-red-800';
      case 'DROP': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'SECURITY': return 'bg-red-100 text-red-800';
      case 'PERFORMANCE': return 'bg-blue-100 text-blue-800';
      case 'COMPLIANCE': return 'bg-purple-100 text-purple-800';
      case 'MONITORING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Firewall Management
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
            <Shield className="h-5 w-5" />
            Firewall Management
          </CardTitle>
          <CardDescription>
            Manage firewall rules and monitor security impact
          </CardDescription>
        </CardHeader>
      </Card>

      {securityImpact && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Security Score</p>
                  <p className="text-2xl font-bold">{securityImpact.securityScore.toFixed(1)}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Rules</p>
                  <p className="text-2xl font-bold">{securityImpact.activeRules}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Availability Impact</p>
                  <p className="text-2xl font-bold">{securityImpact.availabilityImpact.toFixed(1)}%</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Performance Impact</p>
                  <p className="text-2xl font-bold">{securityImpact.performanceImpact.toFixed(1)}%</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Firewall Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Firewall Rules</CardTitle>
                  <CardDescription>
                    Manage your firewall rules and security policies
                  </CardDescription>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rule
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Firewall Rule</DialogTitle>
                      <DialogDescription>
                        Configure a new firewall rule for your datacenter
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Rule Name</Label>
                        <Input
                          id="name"
                          value={newRule.name}
                          onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                          placeholder="Enter rule name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={newRule.category} onValueChange={(value) => setNewRule({ ...newRule, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GENERAL">General</SelectItem>
                            <SelectItem value="SECURITY">Security</SelectItem>
                            <SelectItem value="PERFORMANCE">Performance</SelectItem>
                            <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                            <SelectItem value="MONITORING">Monitoring</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newRule.description}
                          onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                          placeholder="Enter rule description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sourceIp">Source IP</Label>
                        <Input
                          id="sourceIp"
                          value={newRule.sourceIp}
                          onChange={(e) => setNewRule({ ...newRule, sourceIp: e.target.value })}
                          placeholder="0.0.0.0/0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="destinationIp">Destination IP</Label>
                        <Input
                          id="destinationIp"
                          value={newRule.destinationIp}
                          onChange={(e) => setNewRule({ ...newRule, destinationIp: e.target.value })}
                          placeholder="0.0.0.0/0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sourcePort">Source Port</Label>
                        <Input
                          id="sourcePort"
                          value={newRule.sourcePort}
                          onChange={(e) => setNewRule({ ...newRule, sourcePort: e.target.value })}
                          placeholder="Any or specific port"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="destinationPort">Destination Port</Label>
                        <Input
                          id="destinationPort"
                          value={newRule.destinationPort}
                          onChange={(e) => setNewRule({ ...newRule, destinationPort: e.target.value })}
                          placeholder="80, 443, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="protocol">Protocol</Label>
                        <Select value={newRule.protocol} onValueChange={(value) => setNewRule({ ...newRule, protocol: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TCP">TCP</SelectItem>
                            <SelectItem value="UDP">UDP</SelectItem>
                            <SelectItem value="ICMP">ICMP</SelectItem>
                            <SelectItem value="ANY">Any</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="action">Action</Label>
                        <Select value={newRule.action} onValueChange={(value) => setNewRule({ ...newRule, action: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALLOW">Allow</SelectItem>
                            <SelectItem value="DENY">Deny</SelectItem>
                            <SelectItem value="DROP">Drop</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Input
                          id="priority"
                          type="number"
                          value={newRule.priority}
                          onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 100 })}
                          min="1"
                          max="1000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          value={newRule.tags}
                          onChange={(e) => setNewRule({ ...newRule, tags: e.target.value })}
                          placeholder="web, database, critical"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateRule}>
                        Create Rule
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
                    <TableHead>Source</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{rule.sourceIp}</div>
                          {rule.sourcePort && <div className="text-gray-500">:{rule.sourcePort}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{rule.destinationIp}</div>
                          {rule.destinationPort && <div className="text-gray-500">:{rule.destinationPort}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{rule.protocol}</TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(rule.action)}>
                          {rule.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadgeColor(rule.category)}>
                          {rule.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleRule(rule)}
                          >
                            {rule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRule(rule);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
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
          {securityImpact && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rules by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(securityImpact.rulesByCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <Badge className={getCategoryBadgeColor(category)}>
                          {category}
                        </Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Rules by Action</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(securityImpact.rulesByAction).map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between">
                        <Badge className={getActionBadgeColor(action)}>
                          {action}
                        </Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
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
            <DialogTitle>Edit Firewall Rule</DialogTitle>
            <DialogDescription>
              Modify the firewall rule configuration
            </DialogDescription>
          </DialogHeader>
          {selectedRule && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Rule Name</Label>
                <Input
                  id="edit-name"
                  value={selectedRule.name}
                  onChange={(e) => setSelectedRule({ ...selectedRule, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={selectedRule.category} onValueChange={(value) => setSelectedRule({ ...selectedRule, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="SECURITY">Security</SelectItem>
                    <SelectItem value="PERFORMANCE">Performance</SelectItem>
                    <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                    <SelectItem value="MONITORING">Monitoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedRule.description}
                  onChange={(e) => setSelectedRule({ ...selectedRule, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Input
                  id="edit-priority"
                  type="number"
                  value={selectedRule.priority}
                  onChange={(e) => setSelectedRule({ ...selectedRule, priority: parseInt(e.target.value) || 100 })}
                  min="1"
                  max="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-action">Action</Label>
                <Select value={selectedRule.action} onValueChange={(value) => setSelectedRule({ ...selectedRule, action: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALLOW">Allow</SelectItem>
                    <SelectItem value="DENY">Deny</SelectItem>
                    <SelectItem value="DROP">Drop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRule}>
              Update Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}