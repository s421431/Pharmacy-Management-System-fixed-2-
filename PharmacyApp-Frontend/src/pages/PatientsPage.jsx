import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { Users, Plus, Search, Trash2, CheckCircle, XCircle } from 'lucide-react';
import patientService from '../services/patientService';
import departmentService from '../services/departmentService';

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Employee',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    departmentId: '',
    phone: '',
    parentEmployeeId: '',
    relationship: 'Spouse'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
    // Departments/employees are only needed to populate the "Add Patient" dropdowns.
    // Departments is an Admin-only endpoint; if the logged-in user is a Pharmacist,
    // this call will 403 and we just leave the dropdown empty rather than breaking the page.
    departmentService.getDepartments().then(setDepartments).catch(() => setDepartments([]));
    patientService.getEmployees().then(setEmployees).catch(() => setEmployees([]));
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await patientService.getPatients();
      setPatients(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (formData.type === 'Employee') {
        if (!formData.departmentId) {
          toast({ title: "Error", description: "Please select a department.", variant: "destructive" });
          return;
        }
        await patientService.createEmployee({
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          departmentId: parseInt(formData.departmentId, 10),
          phoneNumber: formData.phone || undefined
        });
      } else {
        if (!formData.parentEmployeeId) {
          toast({ title: "Error", description: "Please select the employee this family member belongs to.", variant: "destructive" });
          return;
        }
        await patientService.addFamilyMember(parseInt(formData.parentEmployeeId, 10), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          relationship: formData.relationship
        });
      }

      toast({
        title: "Success",
        description: "Patient created successfully"
      });

      fetchPatients();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.Error || error.response?.data?.message || error.message,
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (patient) => {
    try {
      if (patient.status === 'Active') {
        await patientService.deactivatePatient(patient.id);
      } else {
        await patientService.activatePatient(patient.id);
      }
      toast({ title: "Success", description: "Patient status updated" });
      fetchPatients();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient? This cannot be undone.')) {
      try {
        await patientService.deletePatient(id);
        toast({
          title: "Success",
          description: "Patient deleted successfully"
        });
        fetchPatients();
      } catch (error) {
        toast({
          title: "Error",
          description: error.response?.data?.message || error.message,
          variant: "destructive"
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'Employee',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      departmentId: '',
      phone: '',
      parentEmployeeId: '',
      relationship: 'Spouse'
    });
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Management</h1>
          <p className="text-muted-foreground">Manage employee and family member records</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Enter patient information below
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="FamilyMember">Family Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                />
              </div>

              {formData.type === 'Employee' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departmentId">Department</Label>
                    <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={departments.length ? "Select department" : "No departments available"} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {formData.type === 'FamilyMember' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentEmployeeId">Employee</Label>
                    <Select value={formData.parentEmployeeId} onValueChange={(value) => setFormData({ ...formData, parentEmployeeId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={employees.length ? "Select employee" : "No employees available"} />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={String(emp.id)}>{emp.firstName} {emp.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="relationship">Relationship</Label>
                    <Select value={formData.relationship} onValueChange={(value) => setFormData({ ...formData, relationship: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Patient
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">
          {filteredPatients.length} patients
        </Badge>
      </div>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Patients</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono text-sm">{patient.id}</td>
                    <td className="p-2 font-medium">{patient.firstName} {patient.lastName}</td>
                    <td className="p-2">
                      <Badge variant={!patient.type ? 'default' : 'secondary'}>
                        {patient.type ? 'Family Member' : 'Employee'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant={patient.status === 'Active' ? 'default' : 'outline'}>
                        {patient.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          title={patient.status === 'Active' ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggleStatus(patient)}
                        >
                          {patient.status === 'Active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Delete"
                          onClick={() => handleDelete(patient.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientsPage;