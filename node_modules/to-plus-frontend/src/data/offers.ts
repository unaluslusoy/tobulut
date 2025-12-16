import { Offer } from '../types';

const offers: Offer[] = [
  {
    id: "OFF-001",
    tenantId: "tenant-1",
    offerNumber: "TKL2024001",
    date: "2024-12-12",
    validUntil: "2024-12-19",
    accountId: "ACC-003",
    accountName: "Global Lojistik",
    status: "sent",
    items: [
      { id: "ITM-1", productId: "PRD-004", productName: "27\" 4K Monitör", quantity: 10, unitPrice: 8500, taxRate: 20, discountRate: 5, total: 96900 }
    ],
    grossTotal: 85000,
    lineDiscountTotal: 4250,
    subtotal: 80750,
    taxTotal: 16150,
    discountType: 'percentage',
    discountValue: 0,
    discountTotal: 0,
    total: 96900,
    currency: "TRY",
    notes: "Toplu alım için özel iskonto uygulanmıştır. Kurulum dahildir."
  },
  {
    id: "OFF-002",
    tenantId: "tenant-1",
    offerNumber: "TKL2024002",
    date: "2024-12-10",
    validUntil: "2024-12-25",
    accountId: "ACC-001",
    accountName: "ABC Mimarlık Ltd. Şti.",
    status: "accepted",
    items: [
      { id: "ITM-2", productId: "PRD-001", productName: "Laptop Pro X1", quantity: 5, unitPrice: 24000, taxRate: 20, discountRate: 0, total: 144000 }
    ],
    grossTotal: 120000,
    lineDiscountTotal: 0,
    subtotal: 120000,
    taxTotal: 24000,
    discountType: 'amount',
    discountValue: 0,
    discountTotal: 0,
    total: 144000,
    currency: "TRY",
    notes: "Stok durumu kontrol edilmiştir."
  }
];

export default offers;