
import { Transaction } from '../types';

const transactions: Transaction[] = [
  { "id": "TRX-001", "tenantId": "tenant-1", "date": "2024-12-01T10:30:00", "description": "Teknoloji A.Ş. Ödemesi", "amount": 12500.00, "type": "income", "status": "completed", "category": "Satış", "accountId": "ACC-001" },
  { "id": "TRX-002", "tenantId": "tenant-1", "date": "2024-12-02T14:15:00", "description": "Ofis Malzemeleri", "amount": 450.50, "type": "expense", "status": "completed", "category": "Operasyon" },
  { "id": "TRX-003", "tenantId": "tenant-1", "date": "2024-12-02T09:00:00", "description": "Sunucu Barındırma", "amount": 120.00, "type": "expense", "status": "pending", "category": "Bilgi İşlem" },
  { "id": "TRX-004", "tenantId": "tenant-1", "date": "2024-12-03T16:45:00", "description": "Danışmanlık Hizmeti", "amount": 3500.00, "type": "income", "status": "completed", "category": "Hizmetler", "accountId": "ACC-003" },
  { "id": "TRX-005", "tenantId": "tenant-1", "date": "2024-12-03T11:20:00", "description": "Elektrik/Su Faturası", "amount": 890.00, "type": "expense", "status": "completed", "category": "Faturalar" },
  { "id": "TRX-006", "tenantId": "tenant-1", "date": "2024-12-11T15:00:00", "description": "Kısmi Tahsilat", "amount": 5000.00, "type": "income", "status": "completed", "category": "Tahsilat", "accountId": "ACC-001" }
];

export default transactions;
