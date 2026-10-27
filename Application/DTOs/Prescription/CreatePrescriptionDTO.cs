using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Prescription
{
    public class CreatePrescriptionDTO
    {
        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = null!;

        public DateOnly? IssueDate { get; set; } = DateOnly.FromDateTime(DateTime.Now);

        [Required]
        public int UserId { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "A prescription must have at least one medication.")]
        public List<PrescriptionItemDTO>? PrescriptionItems { get; set; }
    }
}
