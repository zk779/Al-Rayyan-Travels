"use client";

import { useState } from "react";
import {
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "../../shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcn/components/ui/select";
import { Badge } from "../../shadcn/components/ui/badge";
import { Checkbox } from "../../shadcn/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../shadcn/components/ui/table";
import { Calendar as CalendarComponent } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../shadcn/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../shadcn/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../shadcn/components/ui/alert-dialog";
import { Textarea } from "../../shadcn/components/ui/textarea";

// Mock expense data
const initialExpenses = [
  {
    id: "1",
    date: "2024-03-15",
    category: "Travel",
    amount: 450.0,
    description: "Business trip to Los Angeles",
    branch: "Main Branch",
    status: "Approved",
  },
  {
    id: "2",
    date: "2024-03-14",
    category: "Office Supplies",
    amount: 125.5,
    description: "Office supplies for Q1",
    branch: "Main Branch",
    status: "Pending",
  },
  {
    id: "3",
    date: "2024-03-13",
    category: "Marketing",
    amount: 800.0,
    description: "Google Ads campaign",
    branch: "Airport Branch",
    status: "Approved",
  },
  {
    id: "4",
    date: "2024-03-12",
    category: "Meals",
    amount: 180.75,
    description: "Client dinner meeting",
    branch: "Downtown Branch",
    status: "Rejected",
  },
];

const categories = [
  "Travel",
  "Meals",
  "Office Supplies",
  "Marketing",
  "Technology",
  "Training",
  "Other",
];
const branches = [
  "Main Branch",
  "Airport Branch",
  "Mall Branch",
  "Downtown Branch",
];
const statuses = ["Pending", "Approved", "Rejected"];

export default function ExpensePage() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);

  // Form state
  const [expenseForm, setExpenseForm] = useState({
    date: new Date(),
    category: "",
    amount: "",
    description: "",
    branch: "",
    status: "Pending",
  });

  // Calculate totals
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const approvedExpenses = expenses
    .filter((expense) => expense.status === "Approved")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = expenses
    .filter((expense) => expense.status === "Pending")
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesStatus =
      statusFilter === "all" ||
      expense.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCategory =
      categoryFilter === "all" || expense.category === categoryFilter;
    const matchesSearch =
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.branch.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Selection handlers
  const handleSelectAll = (checked) => {
    setSelectedExpenses(
      checked ? filteredExpenses.map((expense) => expense.id) : []
    );
  };

  const handleSelectExpense = (expenseId, checked) => {
    setSelectedExpenses(
      checked
        ? [...selectedExpenses, expenseId]
        : selectedExpenses.filter((id) => id !== expenseId)
    );
  };

  // CRUD operations
  const handleAddExpense = () => {
    const newExpense = {
      id: Date.now().toString(),
      ...expenseForm,
      date: format(expenseForm.date, "yyyy-MM-dd"),
      amount: Number.parseFloat(expenseForm.amount),
    };
    setExpenses([newExpense, ...expenses]);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      date: new Date(expense.date),
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description,
      branch: expense.branch,
      status: expense.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateExpense = () => {
    const updatedExpense = {
      ...editingExpense,
      ...expenseForm,
      date: format(expenseForm.date, "yyyy-MM-dd"),
      amount: Number.parseFloat(expenseForm.amount),
    };
    setExpenses(
      expenses.map((expense) =>
        expense.id === editingExpense.id ? updatedExpense : expense
      )
    );
    setEditingExpense(null);
    resetForm();
    setIsEditDialogOpen(false);
  };

  const handleViewExpense = (expense) => {
    setViewingExpense(expense);
    setIsViewDialogOpen(true);
  };

  const handleDeleteExpense = (id) => {
    setDeleteExpenseId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    setExpenses(expenses.filter((expense) => expense.id !== deleteExpenseId));
    setSelectedExpenses(
      selectedExpenses.filter((id) => id !== deleteExpenseId)
    );
    setDeleteExpenseId(null);
    setIsDeleteDialogOpen(false);
  };

  const handleBulkDelete = () => {
    setExpenses(
      expenses.filter((expense) => !selectedExpenses.includes(expense.id))
    );
    setSelectedExpenses([]);
  };

  const resetForm = () => {
    setExpenseForm({
      date: new Date(),
      category: "",
      amount: "",
      description: "",
      branch: "",
      status: "Pending",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "default";
      case "Pending":
        return "secondary";
      case "Rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Expense Management
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage company expenses
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} total expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${approvedExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses.filter((e) => e.status === "Approved").length} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${pendingExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses.filter((e) => e.status === "Pending").length} pending
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Expenses</CardTitle>
            {selectedExpenses.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedExpenses.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedExpenses.length === filteredExpenses.length &&
                        filteredExpenses.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedExpenses.includes(expense.id)}
                          onCheckedChange={(checked) =>
                            handleSelectExpense(expense.id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(expense.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.branch}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(expense.status)}>
                          {expense.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewExpense(expense)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditExpense(expense)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingExpense(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? "Update expense details"
                : "Enter expense information"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-transparent"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {expenseForm.date
                      ? format(expenseForm.date, "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={expenseForm.date}
                    onSelect={(date) =>
                      setExpenseForm({ ...expenseForm, date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 ">
              <Label>Category</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) =>
                  setExpenseForm({ ...expenseForm, category: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Branch</Label>
              <Select
                value={expenseForm.branch}
                onValueChange={(value) =>
                  setExpenseForm({ ...expenseForm, branch: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={expenseForm.status}
                onValueChange={(value) =>
                  setExpenseForm({ ...expenseForm, status: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter expense description"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setEditingExpense(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
              disabled={
                !expenseForm.description ||
                !expenseForm.amount ||
                !expenseForm.category
              }
            >
              {editingExpense ? "Update" : "Add"} Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Expense Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Date
                  </Label>
                  <p className="text-base">
                    {format(new Date(viewingExpense.date), "MMMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Category
                  </Label>
                  <p className="text-base">{viewingExpense.category}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Amount
                </Label>
                <p className="text-2xl font-bold">
                  ${viewingExpense.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Description
                </Label>
                <p className="text-base">{viewingExpense.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Branch
                  </Label>
                  <p className="text-base">{viewingExpense.branch}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Status
                  </Label>
                  <Badge variant={getStatusColor(viewingExpense.status)}>
                    {viewingExpense.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            {viewingExpense && (
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditExpense(viewingExpense);
                }}
              >
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              expense record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
