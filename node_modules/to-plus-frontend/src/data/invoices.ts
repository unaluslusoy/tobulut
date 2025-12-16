import { Invoice } from '../types';

const invoices: Invoice[] = [
  {
    id: "INV-001",
    invoiceNumber: "GIB2024000001",
    date: "2024-12-01",
    dueDate: "2024-12-15",
    accountId: "ACC-001",
    accountName: "ABC Mimarlık Ltd. Şti.",
    type: "sales",
    status: "paid",
    items: [
      { id: "ITEM-1", productId: "PRD-001", productName: "Laptop Pro X1", quantity: 2, unitPrice: 24000, taxRate: 20, discountRate: 0, total: 57600 }
    ],
    grossTotal: 48000,
    lineDiscountTotal: 0,
    subtotal: 48000,
    taxTotal: 9600,
    discountType: 'percentage',
    discountValue: 0,
    discountTotal: 0,
    total: 57600,
    currency: "TRY"
  },
  {
    id: "INV-002",
    invoiceNumber: "GIB2024000002",
    date: "2024-12-05",
    dueDate: "2024-12-20",
    accountId: "ACC-003",
    accountName: "Global Lojistik",
    type: "sales",
    status: "sent",
    items: [
      { id: "ITEM-2", productId: "PRD-004", productName: "27\" 4K Monitör", quantity: 5, unitPrice: 8500, taxRate: 20, discountRate: 5, total: 48450 }
    ],
    grossTotal: 42500,
    lineDiscountTotal: 2125,
    subtotal: 40375, // (8500 * 5) * 0.95
    taxTotal: 8075,
    discountType: 'percentage',
    discountValue: 0,
    discountTotal: 0,
    total: 48450,
    currency: "TRY"
  },
  {
    id: "INV-003",
    invoiceNumber: "ABC20240567",
    date: "2024-12-10",
    dueDate: "2024-12-25",
    accountId: "ACC-002",
    accountName: "TeknoTedarik A.Ş.",
    type: "purchase",
    status: "pending", 
    items: [
      { id: "ITEM-3", productId: "PRD-002", productName: "Kablosuz Mouse", quantity: 50, unitPrice: 250, taxRate: 20, discountRate: 0, total: 15000 }
    ],
    grossTotal: 12500,
    lineDiscountTotal: 0,
    subtotal: 12500,
    taxTotal: 2500,
    discountType: 'amount',
    discountValue: 0,
    discountTotal: 0,
    total: 15000,
    currency: "TRY"
  }
] as Invoice[];

export default invoices;