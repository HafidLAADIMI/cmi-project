export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  createdAt?: Date;
  paidAt?: Date;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  orderId: string;
  error?: string;
}

export interface AlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'info' | 'success' | 'error' | 'warning';
}
export interface ReceiptData {
  orderId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    variations?: any[];
    addons?: any[];
  }>;
  total: number;
  paymentMethod: string;
  timestamp: Date;
  customerInfo?: {
    name: string;
    phone?: string;
    address?: string;
    region?: string;
  };
  storeInfo?: {
    name: string;
    address: string;
    phone: string;
    email?: string;
  };
}