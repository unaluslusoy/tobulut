import { CashRegister } from '../types';

const cashRegisters: CashRegister[] = [
  {
    id: "REG-001",
    tenantId: "tenant-1",
    name: "Merkez Kasa (TL)",
    type: "cash",
    currency: "TRY",
    balance: 12500.50
  },
  {
    id: "REG-002",
    tenantId: "tenant-1",
    name: "Merkez Kasa (USD)",
    type: "cash",
    currency: "USD",
    balance: 450.00
  },
  {
    id: "REG-003",
    tenantId: "tenant-1",
    name: "Garanti Bankası",
    type: "bank",
    currency: "TRY",
    balance: 154000.00,
    bankName: "Garanti BBVA",
    iban: "TR12 0006 2000 0001 2345 6789 01"
  },
  {
    id: "REG-004",
    tenantId: "tenant-1",
    name: "Yapı Kredi POS",
    type: "pos",
    currency: "TRY",
    balance: 23450.00,
    bankName: "Yapı Kredi"
  },
  {
    id: "REG-005",
    tenantId: "tenant-1",
    name: "İş Bankası (EUR)",
    type: "bank",
    currency: "EUR",
    balance: 1200.00,
    bankName: "İş Bankası",
    iban: "TR56 0006 4000 0001 2345 6789 99"
  }
];

export default cashRegisters;