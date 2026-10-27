using Domain.Entities;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.DataSeeders
{
    /// <summary>
    /// Seeds sample/mock data so the app is usable out of the box without needing to
    /// manually create every manufacturer, medication form/class, active ingredient,
    /// medication, and supplier by hand first.
    ///
    /// Unlike a simple "table is empty" check, this checks each specific mock record by
    /// name and only inserts the ones that are missing. That way it always ensures this
    /// starter data exists, without ever duplicating or disturbing anything you've
    /// already added yourself.
    /// </summary>
    public static class ReferenceDataSeedData
    {
        public static async Task Initialize(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetRequiredService<PharmacyDbContext>();

            // --- Manufacturers ---
            var manufacturerNames = new[] { "Cipla", "Sun Pharma", "Pfizer", "GlaxoSmithKline" };
            foreach (var name in manufacturerNames)
            {
                if (!await context.Manufacturers.AnyAsync(m => m.Name == name))
                {
                    context.Manufacturers.Add(new Manufacturer { Name = name, PhoneNumber = "9876543210" });
                }
            }
            await context.SaveChangesAsync();

            // --- Medication Forms ---
            var formSpecs = new (string Name, string Unit)[]
            {
                ("Tablet", "tablet"), ("Capsule", "capsule"), ("Syrup", "ml"), ("Injection", "ml")
            };
            foreach (var (name, unit) in formSpecs)
            {
                if (!await context.MedicationForms.AnyAsync(f => f.Name == name))
                {
                    context.MedicationForms.Add(new MedicationForm { Name = name, Unit = unit });
                }
            }
            await context.SaveChangesAsync();

            // --- Medication Classes ---
            var classSpecs = new (string Name, string Description)[]
            {
                ("Analgesic", "Pain relief medication"),
                ("Antibiotic", "Treats bacterial infections"),
                ("Antihistamine", "Treats allergy symptoms"),
                ("Antacid", "Relieves acidity/heartburn")
            };
            foreach (var (name, description) in classSpecs)
            {
                if (!await context.MedicationClasses.AnyAsync(c => c.Name == name))
                {
                    context.MedicationClasses.Add(new MedicationClass { Name = name, Description = description });
                }
            }
            await context.SaveChangesAsync();

            // --- Active Ingredients ---
            var ingredientNames = new[] { "Paracetamol", "Amoxicillin", "Ibuprofen", "Cetirizine", "Omeprazole", "Metformin" };
            foreach (var name in ingredientNames)
            {
                if (!await context.ActiveIngredients.AnyAsync(i => i.Name == name))
                {
                    context.ActiveIngredients.Add(new ActiveIngredient { Name = name });
                }
            }
            await context.SaveChangesAsync();

            // --- Sample Medications (needs the above to exist; identified by Barcode) ---
            var manufacturers = await context.Manufacturers.ToListAsync();
            var forms = await context.MedicationForms.ToListAsync();
            var classes = await context.MedicationClasses.ToListAsync();
            var ingredients = await context.ActiveIngredients.ToListAsync();

            int mfr(string name) => manufacturers.First(m => m.Name == name).Id;
            int form(string name) => forms.First(f => f.Name == name).Id;
            int cls(string name) => classes.First(c => c.Name == name).Id;
            int ing(string name) => ingredients.First(i => i.Name == name).Id;

            var medicationSpecs = new[]
            {
                new { Barcode = "8901000000011", Name = "Paracetamol 500mg", Dose = "500mg", MinQuantity = 50, Manufacturer = "Cipla", Form = "Tablet", Class = "Analgesic", Ingredient = "Paracetamol", Amount = 500m },
                new { Barcode = "8901000000028", Name = "Amoxicillin 250mg", Dose = "250mg", MinQuantity = 30, Manufacturer = "Sun Pharma", Form = "Capsule", Class = "Antibiotic", Ingredient = "Amoxicillin", Amount = 250m },
                new { Barcode = "8901000000035", Name = "Ibuprofen 400mg", Dose = "400mg", MinQuantity = 40, Manufacturer = "Pfizer", Form = "Tablet", Class = "Analgesic", Ingredient = "Ibuprofen", Amount = 400m },
                new { Barcode = "8901000000042", Name = "Cetirizine 10mg", Dose = "10mg", MinQuantity = 60, Manufacturer = "GlaxoSmithKline", Form = "Tablet", Class = "Antihistamine", Ingredient = "Cetirizine", Amount = 10m },
                new { Barcode = "8901000000059", Name = "Omeprazole 20mg", Dose = "20mg", MinQuantity = 35, Manufacturer = "Cipla", Form = "Capsule", Class = "Antacid", Ingredient = "Omeprazole", Amount = 20m },
                new { Barcode = "8901000000066", Name = "Amoxicillin Syrup 125mg/5ml", Dose = "125mg/5ml", MinQuantity = 20, Manufacturer = "Sun Pharma", Form = "Syrup", Class = "Antibiotic", Ingredient = "Amoxicillin", Amount = 125m }
            };

            foreach (var spec in medicationSpecs)
            {
                if (!await context.Medications.AnyAsync(m => m.Barcode == spec.Barcode))
                {
                    context.Medications.Add(new Medication
                    {
                        Name = spec.Name,
                        Barcode = spec.Barcode,
                        Dose = spec.Dose,
                        MinQuantity = spec.MinQuantity,
                        ManufacturerId = mfr(spec.Manufacturer),
                        FormId = form(spec.Form),
                        ClassId = cls(spec.Class),
                        MedicationActiveIngredients = { new MedicationActiveIngredient { IngredientId = ing(spec.Ingredient), Amount = spec.Amount } }
                    });
                }
            }
            await context.SaveChangesAsync();

            // --- Suppliers ---
            var supplierNames = new[] { "MedSupply Co.", "HealthDistributors Ltd.", "PharmaWholesale Inc." };
            foreach (var name in supplierNames)
            {
                if (!await context.Suppliers.AnyAsync(s => s.Name == name))
                {
                    context.Suppliers.Add(new Supplier { Name = name, PhoneNumber = "9988776650" });
                }
            }
            await context.SaveChangesAsync();
        }
    }
}