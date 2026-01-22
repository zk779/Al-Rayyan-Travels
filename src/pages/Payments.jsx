'use client';

import { useState } from 'react';
import { Button } from '../../shadcn/components/ui/button';
import { Input } from '../../shadcn/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shadcn/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shadcn/components/ui/tabs';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '../../shadcn/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../shadcn/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../../shadcn/components/ui/table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '../../shadcn/components/ui/dropdown-menu';
import { Badge } from '../../shadcn/components/ui/badge';
import { Plus, Search, MoreVertical, Edit2, Trash2 } from 'lucide-react';

export default function PaymentPage() {
	const [vendorPayments, setVendorPayments] = useState([
		{
			id: 1,
			paymentId: 'VP001',
			vendor: 'Emirates Airlines',
			invoiceNo: 'INV001',
			amount: 5000,
			paymentDate: '2024-01-15',
			method: 'Bank Transfer',
			status: 'Completed',
			remarks: 'Flight booking payment',
		},
		{
			id: 2,
			paymentId: 'VP002',
			vendor: 'Al Maktoum Hotel',
			invoiceNo: 'INV002',
			amount: 3500,
			paymentDate: '2024-01-16',
			method: 'Credit Card',
			status: 'Pending',
			remarks: 'Hotel reservation',
		},
	]);

	const [customerPayments, setCustomerPayments] = useState([
		{
			id: 1,
			paymentId: 'CP001',
			customer: 'Ahmed Ali',
			invoiceNo: 'INV-2024-001',
			amount: 2500,
			paymentDate: '2024-01-15',
			method: 'Cash',
			status: 'Completed',
			remarks: 'Flight booking payment',
		},
		{
			id: 2,
			paymentId: 'CP002',
			customer: 'Fatima Mohammed',
			invoiceNo: 'INV-2024-002',
			amount: 4200,
			paymentDate: '2024-01-16',
			method: 'Credit Card',
			status: 'Completed',
			remarks: 'Holiday package',
		},
	]);

	const [searchVendor, setSearchVendor] = useState('');
	const [searchCustomer, setSearchCustomer] = useState('');
	const [editingVendor, setEditingVendor] = useState(null);
	const [editingCustomer, setEditingCustomer] = useState(null);
	const [formData, setFormData] = useState({});
	const [dialogOpen, setDialogOpen] = useState(false);
	const [type, setType] = useState('vendor');

	const filteredVendor = vendorPayments.filter((p) =>
		Object.values(p).some((v) => v.toString().toLowerCase().includes(searchVendor.toLowerCase()))
	);

	const filteredCustomer = customerPayments.filter((p) =>
		Object.values(p).some((v) => v.toString().toLowerCase().includes(searchCustomer.toLowerCase()))
	);

	const handleAddVendor = () => {
		setType('vendor');
		setEditingVendor(null);
		setFormData({
			vendor: '',
			invoiceNo: '',
			amount: '',
			paymentDate: '',
			method: 'Bank Transfer',
			status: 'Pending',
			remarks: '',
		});
		setDialogOpen(true);
	};

	const handleAddCustomer = () => {
		setType('customer');
		setEditingCustomer(null);
		setFormData({
			customer: '',
			invoiceNo: '',
			amount: '',
			paymentDate: '',
			method: 'Cash',
			status: 'Completed',
			remarks: '',
		});
		setDialogOpen(true);
	};

	const handleEditVendor = (payment) => {
		setType('vendor');
		setEditingVendor(payment.id);
		setFormData(payment);
		setDialogOpen(true);
	};

	const handleEditCustomer = (payment) => {
		setType('customer');
		setEditingCustomer(payment.id);
		setFormData(payment);
		setDialogOpen(true);
	};

	const handleSave = () => {
		if (type === 'vendor') {
			if (editingVendor) {
				setVendorPayments(
					vendorPayments.map((p) => (p.id === editingVendor ? { ...p, ...formData } : p))
				);
			} else {
				setVendorPayments([
					...vendorPayments,
					{ ...formData, id: Date.now(), paymentId: `VP${vendorPayments.length + 1}` },
				]);
			}
		} else {
			if (editingCustomer) {
				setCustomerPayments(
					customerPayments.map((p) => (p.id === editingCustomer ? { ...p, ...formData } : p))
				);
			} else {
				setCustomerPayments([
					...customerPayments,
					{ ...formData, id: Date.now(), paymentId: `CP${customerPayments.length + 1}` },
				]);
			}
		}
		setDialogOpen(false);
	};

	const handleDeleteVendor = (id) => {
		setVendorPayments(vendorPayments.filter((p) => p.id !== id));
	};

	const handleDeleteCustomer = (id) => {
		setCustomerPayments(customerPayments.filter((p) => p.id !== id));
	};

	const totalsVendor = vendorPayments.reduce((sum, p) => sum + p.amount, 0);
	const totalsCustomer = customerPayments.reduce((sum, p) => sum + p.amount, 0);

	return (
		<div className="space-y-6 p-6">
		<div>
			<h1 className="text-3xl font-bold tracking-tight">Payments</h1>
			<p className="text-muted-foreground">Manage all vendor and customer payments</p>
		</div>
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">Total Vendor Payments</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">${totalsVendor.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">{vendorPayments.length} payments</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">Total Customer Payments</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">${totalsCustomer.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">{customerPayments.length} payments</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">Combined Total</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">${(totalsVendor + totalsCustomer).toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">All payments</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="vendor" className="space-y-4">
				<TabsList>
					<TabsTrigger value="vendor">Vendor Payments</TabsTrigger>
					<TabsTrigger value="customer">Customer Payments</TabsTrigger>
				</TabsList>

				<TabsContent value="vendor" className="space-y-4">
					<div className="flex gap-3">
						<div className="relative flex-1">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search vendor, invoice, amount..."
								className="pl-8"
								value={searchVendor}
								onChange={(e) => setSearchVendor(e.target.value)}
							/>
						</div>
						<Dialog open={dialogOpen && type === 'vendor'} onOpenChange={setDialogOpen}>
							<DialogTrigger asChild>
								<Button onClick={handleAddVendor}>
									<Plus className="h-4 w-4 mr-2" /> Add Payment
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>{editingVendor ? 'Edit' : 'Add'} Vendor Payment</DialogTitle>
								</DialogHeader>
								<div className="space-y-4">
									<Input
										placeholder="Vendor Name"
										value={formData.vendor || ''}
										onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
									/>
									<Input
										placeholder="Invoice Number"
										value={formData.invoiceNo || ''}
										onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
									/>
									<Input
										type="number"
										placeholder="Amount"
										value={formData.amount || ''}
										onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
									/>
									<Input
										type="date"
										value={formData.paymentDate || ''}
										onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
									/>
									<Select value={formData.method || 'Bank Transfer'} onValueChange={(v) => setFormData({ ...formData, method: v })}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
											<SelectItem value="Credit Card">Credit Card</SelectItem>
											<SelectItem value="Cash">Cash</SelectItem>
											<SelectItem value="Check">Check</SelectItem>
										</SelectContent>
									</Select>
									<Select value={formData.status || 'Pending'} onValueChange={(v) => setFormData({ ...formData, status: v })}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Pending">Pending</SelectItem>
											<SelectItem value="Completed">Completed</SelectItem>
											<SelectItem value="Cancelled">Cancelled</SelectItem>
										</SelectContent>
									</Select>
									<Input
										placeholder="Remarks"
										value={formData.remarks || ''}
										onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
									/>
									<Button onClick={handleSave} className="w-full">Save Payment</Button>
								</div>
							</DialogContent>
						</Dialog>
					</div>

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Payment ID</TableHead>
								<TableHead>Vendor</TableHead>
								<TableHead>Invoice</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Method</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredVendor.map((payment) => (
								<TableRow key={payment.id}>
									<TableCell className="font-mono text-sm">{payment.paymentId}</TableCell>
									<TableCell>{payment.vendor}</TableCell>
									<TableCell>{payment.invoiceNo}</TableCell>
									<TableCell>${payment.amount.toLocaleString()}</TableCell>
									<TableCell>{payment.paymentDate}</TableCell>
									<TableCell>{payment.method}</TableCell>
									<TableCell>
										<Badge variant={payment.status === 'Completed' ? 'default' : 'secondary'}>
											{payment.status}
										</Badge>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													<MoreVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent>
												<DropdownMenuItem onClick={() => handleEditVendor(payment)}>
													<Edit2 className="h-4 w-4 mr-2" /> Edit
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => handleDeleteVendor(payment.id)} className="text-red-600">
													<Trash2 className="h-4 w-4 mr-2" /> Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TabsContent>

				<TabsContent value="customer" className="space-y-4">
					<div className="flex gap-3">
						<div className="relative flex-1">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search customer, invoice, amount..."
								className="pl-8"
								value={searchCustomer}
								onChange={(e) => setSearchCustomer(e.target.value)}
							/>
						</div>
						<Dialog open={dialogOpen && type === 'customer'} onOpenChange={setDialogOpen}>
							<DialogTrigger asChild>
								<Button onClick={handleAddCustomer}>
									<Plus className="h-4 w-4 mr-2" /> Add Payment
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>{editingCustomer ? 'Edit' : 'Add'} Customer Payment</DialogTitle>
								</DialogHeader>
								<div className="space-y-4">
									<Input
										placeholder="Customer Name"
										value={formData.customer || ''}
										onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
									/>
									<Input
										placeholder="Invoice Number"
										value={formData.invoiceNo || ''}
										onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
									/>
									<Input
										type="number"
										placeholder="Amount"
										value={formData.amount || ''}
										onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
									/>
									<Input
										type="date"
										value={formData.paymentDate || ''}
										onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
									/>
									<Select value={formData.method || 'Cash'} onValueChange={(v) => setFormData({ ...formData, method: v })}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Cash">Cash</SelectItem>
											<SelectItem value="Credit Card">Credit Card</SelectItem>
											<SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
											<SelectItem value="Check">Check</SelectItem>
										</SelectContent>
									</Select>
									<Select value={formData.status || 'Completed'} onValueChange={(v) => setFormData({ ...formData, status: v })}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Pending">Pending</SelectItem>
											<SelectItem value="Completed">Completed</SelectItem>
											<SelectItem value="Cancelled">Cancelled</SelectItem>
										</SelectContent>
									</Select>
									<Input
										placeholder="Remarks"
										value={formData.remarks || ''}
										onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
									/>
									<Button onClick={handleSave} className="w-full">Save Payment</Button>
								</div>
							</DialogContent>
						</Dialog>
					</div>

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Payment ID</TableHead>
								<TableHead>Customer</TableHead>
								<TableHead>Invoice</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Method</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredCustomer.map((payment) => (
								<TableRow key={payment.id}>
									<TableCell className="font-mono text-sm">{payment.paymentId}</TableCell>
									<TableCell>{payment.customer}</TableCell>
									<TableCell>{payment.invoiceNo}</TableCell>
									<TableCell>${payment.amount.toLocaleString()}</TableCell>
									<TableCell>{payment.paymentDate}</TableCell>
									<TableCell>{payment.method}</TableCell>
									<TableCell>
										<Badge variant={payment.status === 'Completed' ? 'default' : 'secondary'}>
											{payment.status}
										</Badge>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													<MoreVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent>
												<DropdownMenuItem onClick={() => handleEditCustomer(payment)}>
													<Edit2 className="h-4 w-4 mr-2" /> Edit
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => handleDeleteCustomer(payment.id)} className="text-red-600">
													<Trash2 className="h-4 w-4 mr-2" /> Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TabsContent>
			</Tabs>
		</div>
			</div>
	);
}
