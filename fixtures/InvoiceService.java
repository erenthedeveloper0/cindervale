package studio.billing;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/** Issues invoices for completed project milestones. */
public final class InvoiceService {
    private static final int DUE_DAYS = 30;
    private final InvoiceRepository repository;

    public InvoiceService(InvoiceRepository repository) {
        this.repository = repository;
    }

    @Override
    public String toString() {
        return "InvoiceService[due=" + DUE_DAYS + "]";
    }

    public Optional<Invoice> issue(long projectId, List<BigDecimal> amounts) {
        if (amounts.isEmpty()) {
            return Optional.empty();
        }
        BigDecimal total = amounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        var invoice = new Invoice(projectId, total, DUE_DAYS);
        repository.save(invoice);
        return Optional.of(invoice);
    }
}
