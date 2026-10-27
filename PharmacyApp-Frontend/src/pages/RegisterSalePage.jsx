import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext.jsx';
import medicationService from '../services/medicationService';
import prescriptionService from '../services/prescriptionService';
import { Trash2, Receipt, Loader2, Pill } from 'lucide-react';

const RegisterSalePage = () => {
    const [customerName, setCustomerName] = useState('');
    const [medicationSearch, setMedicationSearch] = useState('');
    const [medicationSuggestions, setMedicationSuggestions] = useState([]);
    const [saleItems, setSaleItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const { toast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Debounced medicine search (waits 300ms after the user stops typing)
    useEffect(() => {
        const term = medicationSearch.trim();
        if (term.length < 2) {
            setMedicationSuggestions([]);
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const results = await medicationService.searchMedications(term);
                if (!cancelled) setMedicationSuggestions(results);
            } catch (error) {
                console.error('Medication search failed:', error);
                if (!cancelled) setMedicationSuggestions([]);
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [medicationSearch]);

    const addMedication = (medication) => {
        if (!saleItems.some((item) => item.medicationId === medication.id)) {
            setSaleItems([
                ...saleItems,
                {
                    medicationId: medication.id,
                    medicationName: `${medication.name} ${medication.dose ?? ''}`.trim(),
                    quantity: 1,
                },
            ]);
        }
        setMedicationSearch('');
        setMedicationSuggestions([]);
    };

    const updateQuantity = (medicationId, value) => {
        setSaleItems(
            saleItems.map((item) =>
                item.medicationId === medicationId
                    ? { ...item, quantity: Math.max(1, parseInt(value) || 1) }
                    : item
            )
        );
    };

    const removeMedication = (medicationId) => {
        setSaleItems(saleItems.filter((item) => item.medicationId !== medicationId));
    };

    const handleSaveSale = async () => {
        if (!customerName.trim()) {
            toast({ title: 'Validation Error', description: 'Please enter the customer name.', variant: 'destructive' });
            return;
        }
        if (saleItems.length === 0) {
            toast({ title: 'Validation Error', description: 'Add at least one medicine.', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                CustomerName: customerName.trim(),
                UserId: user.id,
                PrescriptionItems: saleItems.map(({ medicationId, quantity }) => ({
                    MedicationId: medicationId,
                    Quantity: quantity,
                })),
            };

            const result = await prescriptionService.dispensePrescription(payload);
            toast({ title: 'Success', description: `Sale #${result.id} registered for ${customerName.trim()}.` });
            navigate(`/sales/${result.id}`); // Go to the receipt page
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Could not register the sale. Check stock levels.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl">Register Sale</CardTitle>
                    <CardDescription>Enter the customer name and add the medicines sold.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Customer name */}
                    <div className="space-y-3">
                        <Label htmlFor="customerName" className="font-semibold text-lg">Customer Name</Label>
                        <Input
                            id="customerName"
                            placeholder="e.g. Rahul Sharma"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            maxLength={150}
                        />
                    </div>

                    <Separator />

                    {/* Medicines */}
                    <div className="space-y-4">
                        <Label className="font-semibold text-lg">Medicines</Label>
                        <div className="relative">
                            <Input
                                placeholder="Search medicine by name..."
                                value={medicationSearch}
                                onChange={(e) => setMedicationSearch(e.target.value)}
                            />
                            {medicationSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                    {medicationSuggestions.map((m) => (
                                        <div
                                            key={m.id}
                                            onClick={() => addMedication(m)}
                                            className="p-3 hover:bg-muted cursor-pointer"
                                        >
                                            <p className="font-medium">{m.name} {m.dose}</p>
                                            <p className="text-sm text-muted-foreground">{m.manufacturerName}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 pt-2">
                            {saleItems.map((item) => (
                                <div key={item.medicationId} className="flex items-center justify-between p-3 border rounded-lg">
                                    <span className="font-medium text-sm">{item.medicationName}</span>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={`qty-${item.medicationId}`} className="text-sm">Qty:</Label>
                                        <Input
                                            id={`qty-${item.medicationId}`}
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.medicationId, e.target.value)}
                                            className="w-20 h-8"
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() => removeMedication(item.medicationId)}
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {saleItems.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No medicines added</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    <Button onClick={handleSaveSale} disabled={loading} className="w-full" size="lg">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Receipt className="w-5 h-5 mr-2" />}
                        Save Sale
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default RegisterSalePage;