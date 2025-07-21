import { CONFIG } from '../constants/config';

class ApiService {
  private baseUrl = CONFIG.API_BASE_URL;

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    }
  }

  // Fixed: Added the missing initiateCmiPayment method
  async initiateCmiPayment(items: any[], customerInfo: any) {
    try {
      const response = await fetch(`${this.baseUrl}/api/cmi/initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, customerInfo }),
      });
      return await response.json();
    } catch (error) {
      console.error('CMI Payment failed:', error);
      return { success: false, error: 'Connection failed' };
    }
  }

  // Also adding the order status check method that your payment screen uses
  async getOrderStatus(orderId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/cmi/orders/${orderId}/status`);
      return await response.json();
    } catch (error) {
      console.error('Order status check failed:', error);
      return { success: false, error: 'Connection failed' };
    }
  }

  // Keep the original method name too for compatibility
  async initiatePayment(items: any[], customerInfo: any) {
    return this.initiateCmiPayment(items, customerInfo);
  }
}

export const apiService = new ApiService();