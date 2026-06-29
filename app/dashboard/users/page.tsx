"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { 
  Users, Plus, Search, Edit2, Trash2, Eye, 
  Mail, Phone, MapPin, Calendar, DollarSign, 
  Shield, Clock, CheckCircle, XCircle, Download,
  Filter, MoreHorizontal, UserPlus, UserCheck,
  Building, Briefcase, CreditCard, Award,
  FileText, Printer, RefreshCw, AlertCircle,
  Upload, File, FileImage, FileArchive, X
} from "lucide-react"
import { useApp } from "@/lib/store"
import { formatCurrency, formatDate } from "@/lib/format"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { usersService } from "@/services"

// Types
type UserRole = "owner" | "manager" | "cashier" | "storekeeper" | "admin"
type EmploymentStatus = "active" | "inactive" | "on_leave" | "terminated"
type Department = "management" | "sales" | "inventory" | "finance" | "operations" | "hr"

interface ContractDocument {
  id: string
  name: string
  type: "contract" | "agreement" | "nda" | "policy"
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: string
  uploadedBy: string
  expiryDate?: string
  notes?: string
}

interface Employee {
  id: string
  employeeId: string
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  alternativePhone?: string
  address: string
  city: string
  country: string
  role: UserRole
  department: Department
  position: string
  employmentStatus: EmploymentStatus
  startDate: string
  endDate?: string
  salary: number
  salaryType: "monthly" | "hourly" | "contract"
  bankName?: string
  bankAccount?: string
  emergencyContact?: string
  emergencyPhone?: string
  dateOfBirth?: string
  idNumber?: string
  taxId?: string
  avatar?: string
  notes?: string
  contracts?: ContractDocument[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

// Document Upload Component
function DocumentUpload({ 
  onUpload, 
  onRemove,
  documents = []
}: { 
  onUpload: (file: File, type: string) => void
  onRemove: (docId: string) => void
  documents?: ContractDocument[]
}) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadType, setUploadType] = useState<"contract" | "agreement" | "nda" | "policy">("contract")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0], uploadType)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0], uploadType)
    }
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "contract": return <FileText className="size-4" />
      case "agreement": return <File className="size-4" />
      case "nda": return <Shield className="size-4" />
      case "policy": return <FileText className="size-4" />
      default: return <File className="size-4" />
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "contract": return "Employment Contract"
      case "agreement": return "Agreement"
      case "nda": return "NDA"
      case "policy": return "Policy Document"
      default: return type
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Existing Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <Label>Documents</Label>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {getDocumentIcon(doc.type)}
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getDocumentTypeLabel(doc.type)} • {formatFileSize(doc.fileSize)} • Uploaded {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => window.open(doc.fileUrl, '_blank')}>
                    <Eye className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onRemove(doc.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="space-y-2">
        <Label>Upload Document</Label>
        <div className="flex gap-2">
          <Select value={uploadType} onValueChange={(v: any) => setUploadType(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contract">Employment Contract</SelectItem>
              <SelectItem value="agreement">Agreement</SelectItem>
              <SelectItem value="nda">NDA</SelectItem>
              <SelectItem value="policy">Policy Document</SelectItem>
            </SelectContent>
          </Select>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.jpg,.png"
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4 mr-2" />
            Select File
          </Button>
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag and drop a file here, or click the button above
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
          </p>
        </div>
      </div>
    </div>
  )
}

// Employee Form Component
function EmployeeForm({ 
  onSubmit, 
  onCancel,
  initial,
}: { 
  onSubmit: (data: any) => void
  onCancel: () => void
  initial?: Employee
}) {
  const [formData, setFormData] = useState({
    firstName: initial?.firstName || "",
    lastName: initial?.lastName || "",
    email: initial?.email || "",
    phone: initial?.phone || "",
    alternativePhone: initial?.alternativePhone || "",
    address: initial?.address || "",
    city: initial?.city || "",
    country: initial?.country || "Rwanda",
    role: initial?.role || "cashier",
    department: initial?.department || "sales",
    position: initial?.position || "",
    employmentStatus: initial?.employmentStatus || "active",
    startDate: initial?.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    salary: initial?.salary || 0,
    salaryType: initial?.salaryType || "monthly",
    bankName: initial?.bankName || "",
    bankAccount: initial?.bankAccount || "",
    emergencyContact: initial?.emergencyContact || "",
    emergencyPhone: initial?.emergencyPhone || "",
    dateOfBirth: initial?.dateOfBirth?.split('T')[0] || "",
    idNumber: initial?.idNumber || "",
    taxId: initial?.taxId || "",
    notes: initial?.notes || "",
  })

  const [contracts, setContracts] = useState<ContractDocument[]>(initial?.contracts || [])
  const [activeTab, setActiveTab] = useState("details")

  const roles: { value: UserRole; label: string }[] = [
    { value: "owner", label: "Owner" },
    { value: "manager", label: "Manager" },
    { value: "admin", label: "Admin" },
    { value: "cashier", label: "Cashier" },
    { value: "storekeeper", label: "Storekeeper" },
  ]

  const departments: { value: Department; label: string }[] = [
    { value: "management", label: "Management" },
    { value: "sales", label: "Sales" },
    { value: "inventory", label: "Inventory" },
    { value: "finance", label: "Finance" },
    { value: "operations", label: "Operations" },
    { value: "hr", label: "Human Resources" },
  ]

  const statuses: { value: EmploymentStatus; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "on_leave", label: "On Leave" },
    { value: "terminated", label: "Terminated" },
  ]

  const salaryTypes: { value: "monthly" | "hourly" | "contract"; label: string }[] = [
    { value: "monthly", label: "Monthly Salary" },
    { value: "hourly", label: "Hourly Rate" },
    { value: "contract", label: "Contract Basis" },
  ]

  const handleUploadDocument = (file: File, type: string) => {
    const fileUrl = URL.createObjectURL(file)
    const newContract: ContractDocument = {
      id: `doc_${Date.now()}_${Math.random()}`,
      name: file.name,
      type: type as any,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "System",
    }
    setContracts([...contracts, newContract])
    toast.success(`Document "${file.name}" uploaded successfully`)
  }

  const handleRemoveDocument = (docId: string) => {
    const doc = contracts.find(d => d.id === docId)
    if (doc) {
      URL.revokeObjectURL(doc.fileUrl)
    }
    setContracts(contracts.filter(d => d.id !== docId))
    toast.success("Document removed")
  }

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      contracts,
    })
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Employee Details</TabsTrigger>
          <TabsTrigger value="documents">Documents & Contracts</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="employee@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+250 788 123 456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Alternative Phone</Label>
            <Input
              value={formData.alternativePhone}
              onChange={(e) => setFormData({ ...formData, alternativePhone: e.target.value })}
              placeholder="Alternative contact number"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={formData.role} onValueChange={(v: UserRole) => setFormData({ ...formData, role: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={formData.department} onValueChange={(v: Department) => setFormData({ ...formData, department: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Position/Title *</Label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g., Senior Cashier"
              />
            </div>
            <div className="space-y-2">
              <Label>Employment Status *</Label>
              <Select value={formData.employmentStatus} onValueChange={(v: EmploymentStatus) => setFormData({ ...formData, employmentStatus: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Salary Amount *</Label>
              <Input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Salary Type *</Label>
              <Select value={formData.salaryType} onValueChange={(v: any) => setFormData({ ...formData, salaryType: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {salaryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ID Number</Label>
              <Input
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="National ID"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address *</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Country"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="Bank name"
              />
            </div>
            <div className="space-y-2">
              <Label>Bank Account</Label>
              <Input
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                placeholder="Account number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Emergency Contact Name</Label>
              <Input
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="Emergency contact person"
              />
            </div>
            <div className="space-y-2">
              <Label>Emergency Phone</Label>
              <Input
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                placeholder="Emergency phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax ID (TIN)</Label>
              <Input
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="Tax identification number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the employee..."
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentUpload 
            onUpload={handleUploadDocument}
            onRemove={handleRemoveDocument}
            documents={contracts}
          />
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 justify-end pt-4 mt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {initial ? "Update Employee" : "Add Employee"}
        </Button>
      </div>
    </div>
  )
}

// Employee Details Modal
function EmployeeDetailsModal({ employee, onClose }: { employee: Employee | null; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("details")
  
  if (!employee) return null

  const getInitials = () => {
    return `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase()
  }

  const getStatusBadge = (status: EmploymentStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400">Inactive</Badge>
      case "on_leave":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">On Leave</Badge>
      case "terminated":
        return <Badge variant="destructive">Terminated</Badge>
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      owner: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      admin: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
      cashier: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      storekeeper: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    }
    return <Badge className={colors[role]}>{role}</Badge>
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Dialog open={!!employee} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
          <DialogDescription>Employee ID: {employee.employeeId}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="contracts">Contracts & Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-20">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h2>
                <div className="flex gap-2 mt-1">
                  {getRoleBadge(employee.role)}
                  {getStatusBadge(employee.employmentStatus)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{employee.position} • {employee.department}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Mail className="size-4" />
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p>{employee.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p>{employee.phone}</p>
                </div>
                {employee.alternativePhone && (
                  <div>
                    <span className="text-muted-foreground">Alternative Phone:</span>
                    <p>{employee.alternativePhone}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p>{employee.address}, {employee.city}, {employee.country}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="size-4" />
                Employment Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Employee ID:</span>
                  <p className="font-mono">{employee.employeeId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Start Date:</span>
                  <p>{formatDate(employee.startDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Department:</span>
                  <p className="capitalize">{employee.department}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Position:</span>
                  <p>{employee.position}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Salary:</span>
                  <p className="font-medium">{formatCurrency(employee.salary)}/{employee.salaryType}</p>
                </div>
                {employee.idNumber && (
                  <div>
                    <span className="text-muted-foreground">ID Number:</span>
                    <p>{employee.idNumber}</p>
                  </div>
                )}
                {employee.taxId && (
                  <div>
                    <span className="text-muted-foreground">Tax ID:</span>
                    <p>{employee.taxId}</p>
                  </div>
                )}
              </div>
            </div>

            {(employee.bankName || employee.bankAccount) && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="size-4" />
                    Banking Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {employee.bankName && (
                      <div>
                        <span className="text-muted-foreground">Bank:</span>
                        <p>{employee.bankName}</p>
                      </div>
                    )}
                    {employee.bankAccount && (
                      <div>
                        <span className="text-muted-foreground">Account Number:</span>
                        <p className="font-mono">{employee.bankAccount}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {(employee.emergencyContact || employee.emergencyPhone) && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="size-4" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {employee.emergencyContact && (
                      <div>
                        <span className="text-muted-foreground">Contact Person:</span>
                        <p>{employee.emergencyContact}</p>
                      </div>
                    )}
                    {employee.emergencyPhone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p>{employee.emergencyPhone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {employee.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{employee.notes}</p>
                </div>
              </>
            )}

            <Separator />

            <div className="text-xs text-muted-foreground">
              <p>Created: {formatDate(employee.createdAt)} by {employee.createdBy}</p>
              <p>Last Updated: {formatDate(employee.updatedAt)}</p>
            </div>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-4 mt-4">
            {employee.contracts && employee.contracts.length > 0 ? (
              <div className="space-y-3">
                {employee.contracts.map((doc) => (
                  <Card key={doc.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)} • {formatFileSize(doc.fileSize)} • Uploaded {formatDate(doc.uploadedAt)}
                          </p>
                          {doc.expiryDate && (
                            <p className="text-xs text-muted-foreground">Expires: {formatDate(doc.expiryDate)}</p>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.open(doc.fileUrl, '_blank')}>
                        <Eye className="size-4 mr-2" />
                        View
                      </Button>
                    </div>
                    {doc.notes && (
                      <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">{doc.notes}</p>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="size-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No documents uploaded</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default function UsersPage() {
  const { currentUser, users, addUser, updateUser, deleteUser, setUsers } = useApp()
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all")
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | "all">("all")
  const [departmentFilter, setDepartmentFilter] = useState<Department | "all">("all")
  const [addOpen, setAddOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null)

  // ✅ Fetch users from API on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const data = await usersService.getAll()
        // Convert User[] to Employee[] format
        const employeesData: Employee[] = data.map((u: any) => ({
          id: u.id,
          employeeId: u.employeeId || `EMP-${String(employees.length + 1).padStart(4, '0')}`,
          userId: u.id,
          firstName: u.name?.split(' ')[0] || '',
          lastName: u.name?.split(' ').slice(1).join(' ') || '',
          email: u.email || '',
          phone: u.phone || '',
          address: u.address || '',
          city: u.city || '',
          country: u.country || 'Rwanda',
          role: u.role || 'cashier',
          department: u.department || 'sales',
          position: u.position || '',
          employmentStatus: u.status || 'active',
          startDate: u.startDate || new Date().toISOString(),
          salary: u.salary || 0,
          salaryType: u.salaryType || 'monthly',
          bankName: u.bankName || '',
          bankAccount: u.bankAccount || '',
          emergencyContact: u.emergencyContact || '',
          emergencyPhone: u.emergencyPhone || '',
          dateOfBirth: u.dateOfBirth || '',
          idNumber: u.idNumber || '',
          taxId: u.taxId || '',
          notes: u.notes || '',
          contracts: u.contracts || [],
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: u.updatedAt || new Date().toISOString(),
          createdBy: u.createdBy || 'System',
        }))
        setEmployees(employeesData)
        setUsers(data)
      } catch (error) {
        console.error('Failed to fetch users:', error)
        toast.error('Failed to load users')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [setUsers])

  // Filter employees
  const filteredEmployees = useMemo(() => {
    let filtered = employees

    if (query) {
      filtered = filtered.filter(e =>
        e.firstName.toLowerCase().includes(query.toLowerCase()) ||
        e.lastName.toLowerCase().includes(query.toLowerCase()) ||
        e.email.toLowerCase().includes(query.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(query.toLowerCase())
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(e => e.role === roleFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(e => e.employmentStatus === statusFilter)
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(e => e.department === departmentFilter)
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [employees, query, roleFilter, statusFilter, departmentFilter])

  // Statistics
  const stats = useMemo(() => {
    const totalEmployees = employees.length
    const activeEmployees = employees.filter(e => e.employmentStatus === "active").length
    const onLeave = employees.filter(e => e.employmentStatus === "on_leave").length
    const totalMonthlySalary = employees
      .filter(e => e.employmentStatus === "active")
      .reduce((sum, e) => sum + (e.salaryType === "monthly" ? e.salary : 0), 0)
    
    const byRole: Record<UserRole, number> = {} as any
    employees.forEach(e => {
      byRole[e.role] = (byRole[e.role] || 0) + 1
    })

    return {
      totalEmployees,
      activeEmployees,
      onLeave,
      totalMonthlySalary,
      byRole,
    }
  }, [employees])

  // ✅ Updated to use API - FIXED with proper type handling
  const handleAddEmployee = async (data: any) => {
    try {
      const userData = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        role: data.role,
        department: data.department,
        position: data.position,
        status: data.employmentStatus,
        startDate: data.startDate,
        salary: data.salary,
        salaryType: data.salaryType,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        dateOfBirth: data.dateOfBirth,
        idNumber: data.idNumber,
        taxId: data.taxId,
        notes: data.notes,
        contracts: data.contracts || [],
        createdBy: currentUser?.name || "System",
      }

      const newUser:any = await addUser(userData)
      
      // Check if newUser exists and has an id
      if (!newUser || !newUser.id) {
        throw new Error('Failed to create user: No ID returned')
      }
      
      const newEmployee: Employee = {
        id: newUser.id,
        employeeId: `EMP-${new Date().getFullYear()}${String(employees.length + 1).padStart(4, '0')}`,
        userId: newUser.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        role: data.role,
        department: data.department,
        position: data.position,
        employmentStatus: data.employmentStatus,
        startDate: data.startDate,
        salary: data.salary,
        salaryType: data.salaryType,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        dateOfBirth: data.dateOfBirth,
        idNumber: data.idNumber,
        taxId: data.taxId,
        notes: data.notes,
        contracts: data.contracts || [],
        createdAt: newUser.createdAt || new Date().toISOString(),
        updatedAt: newUser.updatedAt || new Date().toISOString(),
        createdBy: currentUser?.name || "System",
      }
      
      setEmployees([newEmployee, ...employees])
      setAddOpen(false)
      toast.success(`Employee ${newEmployee.firstName} ${newEmployee.lastName} added`)
    } catch (error) {
      console.error('Failed to add employee:', error)
      toast.error('Failed to add employee')
    }
  }

  // ✅ Updated to use API - FIXED with proper type handling
  const handleUpdateEmployee = async (data: any) => {
    if (!editingEmployee) return
    
    try {
      const updatedData = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        role: data.role,
        department: data.department,
        position: data.position,
        status: data.employmentStatus,
        startDate: data.startDate,
        salary: data.salary,
        salaryType: data.salaryType,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        dateOfBirth: data.dateOfBirth,
        idNumber: data.idNumber,
        taxId: data.taxId,
        notes: data.notes,
        contracts: data.contracts || [],
        updatedBy: currentUser?.name || "System",
      }

      const updatedUser:any = await updateUser(editingEmployee.userId, updatedData)
      
      const updatedEmployee: Employee = {
        ...editingEmployee,
        ...data,
        updatedAt: updatedUser?.updatedAt || new Date().toISOString(),
      }
      
      setEmployees(employees.map(e => e.id === editingEmployee.id ? updatedEmployee : e))
      setEditingEmployee(null)
      toast.success("Employee updated")
    } catch (error) {
      console.error('Failed to update employee:', error)
      toast.error('Failed to update employee')
    }
  }

  // ✅ Updated to use API
  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return
    
    try {
      await deleteUser(deletingEmployee.userId)
      setEmployees(employees.filter(e => e.id !== deletingEmployee.id))
      setDeletingEmployee(null)
      toast.success("Employee removed")
    } catch (error) {
      console.error('Failed to delete employee:', error)
      toast.error('Failed to delete employee')
    }
  }

  // Export CSV
  const handleExport = () => {
    if (filteredEmployees.length === 0) {
      toast.error("No employees to export")
      return
    }

    const data = filteredEmployees.map(e => ({
      "Employee ID": e.employeeId,
      "First Name": e.firstName,
      "Last Name": e.lastName,
      "Email": e.email,
      "Phone": e.phone,
      "Role": e.role,
      "Department": e.department,
      "Position": e.position,
      "Status": e.employmentStatus,
      "Start Date": formatDate(e.startDate),
      "Salary": formatCurrency(e.salary),
      "Salary Type": e.salaryType,
      "Address": e.address,
    }))

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map(row => Object.values(row).join(","))
    const csv = [headers, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `employees-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Employees exported")
  }

  // Get status badge
  const getStatusBadge = (status: EmploymentStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400">Inactive</Badge>
      case "on_leave":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">On Leave</Badge>
      case "terminated":
        return <Badge variant="destructive">Terminated</Badge>
    }
  }

  // Get role badge
  const getRoleBadge = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      owner: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      admin: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
      cashier: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      storekeeper: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    }
    return <Badge className={colors[role]}>{role}</Badge>
  }

  // Show loading state
  if (isLoading) {
    return (
      <>
        <DashboardHeader 
          title="Employee Management" 
          description="Manage staff, roles, employment information, and contracts"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="mx-auto size-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading employees...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader 
        title="Employee Management" 
        description="Manage staff, roles, employment information, and contracts"
      />
      
      <div className="flex justify-end gap-2 px-4 md:px-6 pt-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4 mr-2" />
          Export
        </Button>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
              </div>
              <Users className="size-6 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Employees</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeEmployees}</p>
              </div>
              <UserCheck className="size-6 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Leave</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.onLeave}</p>
              </div>
              <Clock className="size-6 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Payroll</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalMonthlySalary)}</p>
              </div>
              <DollarSign className="size-6 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={(v: UserRole | "all") => setRoleFilter(v)}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="storekeeper">Storekeeper</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v: EmploymentStatus | "all") => setStatusFilter(v)}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={(v: Department | "all") => setDepartmentFilter(v)}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Employees Table */}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Salary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                          <p className="text-xs text-muted-foreground">{employee.position}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{employee.employeeId}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{employee.email}</span>
                        <span className="text-xs text-muted-foreground">{employee.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(employee.role)}</TableCell>
                    <TableCell className="capitalize">{employee.department}</TableCell>
                    <TableCell>{getStatusBadge(employee.employmentStatus)}</TableCell>
                    <TableCell>{formatDate(employee.startDate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(employee.salary)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setViewingEmployee(employee)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setEditingEmployee(employee)}
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => setDeletingEmployee(employee)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <Users className="mx-auto size-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No employees found</p>
                      <Button 
                        variant="link" 
                        onClick={() => setAddOpen(true)}
                        className="mt-2"
                      >
                        Add your first employee
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Enter employee details below</DialogDescription>
          </DialogHeader>
          <EmployeeForm 
            onSubmit={handleAddEmployee}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={(o) => !o && setEditingEmployee(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee information</DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <EmployeeForm 
              initial={editingEmployee}
              onSubmit={handleUpdateEmployee}
              onCancel={() => setEditingEmployee(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <EmployeeDetailsModal 
        employee={viewingEmployee} 
        onClose={() => setViewingEmployee(null)} 
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEmployee} onOpenChange={(o) => !o && setDeletingEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingEmployee?.firstName} {deletingEmployee?.lastName}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}