import crypto from 'crypto';
import { CMI_CONFIG } from '../config/cmi-config.js';

export class CMIService {
  
  /**
   * Generate CMI hash according to their specification
   */
  static generateHash(
    clientId: string,
    orderId: string,
    amount: string,
    okUrl: string,
    failUrl: string,
    rnd: string,
    storeKey: string
  ): string {
    const hashString = `${clientId}${orderId}${amount}${okUrl}${failUrl}${rnd}${storeKey}`;
    return crypto.createHash('sha1').update(hashString, 'utf8').digest('base64');
  }

  /**
   * Create CMI payment form HTML
   */
  static createPaymentForm(orderData: {
    orderId: string;
    amount: number;
    customerEmail?: string;
    customerName?: string;
  }): string {
    const { orderId, amount, customerEmail = "", customerName = "" } = orderData;
    
    // Generate random number for security
    const rnd = Math.random().toString().substring(2, 10);
    
    // Format amount (CMI expects 2 decimal places)
    const formattedAmount = amount.toFixed(2);
    
    // Generate hash
    const hash = this.generateHash(
      CMI_CONFIG.CLIENT_ID,
      orderId,
      formattedAmount,
      CMI_CONFIG.OK_URL,
      CMI_CONFIG.FAIL_URL,
      rnd,
      CMI_CONFIG.STORE_KEY
    );
    
    const paymentUrl = CMI_CONFIG.IS_TEST ? CMI_CONFIG.TEST_URL : CMI_CONFIG.PROD_URL;
    
    // Create HTML form that auto-submits to CMI
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CMI Payment - Redirecting...</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          }
          .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔒 Secure Payment</h2>
          <div class="spinner"></div>
          <p>Redirecting to CMI Payment Gateway...</p>
          <p><small>Order: ${orderId}</small></p>
        </div>
        
        <form id="cmiForm" action="${paymentUrl}" method="post">
          <input type="hidden" name="clientid" value="${CMI_CONFIG.CLIENT_ID}">
          <input type="hidden" name="amount" value="${formattedAmount}">
          <input type="hidden" name="currency" value="${CMI_CONFIG.CURRENCY}">
          <input type="hidden" name="oid" value="${orderId}">
          <input type="hidden" name="okUrl" value="${CMI_CONFIG.OK_URL}">
          <input type="hidden" name="failUrl" value="${CMI_CONFIG.FAIL_URL}">
          <input type="hidden" name="rnd" value="${rnd}">
          <input type="hidden" name="hash" value="${hash}">
          <input type="hidden" name="storetype" value="${CMI_CONFIG.STORE_TYPE}">
          <input type="hidden" name="lang" value="${CMI_CONFIG.LANG}">
          <input type="hidden" name="email" value="${customerEmail}">
          <input type="hidden" name="BillToName" value="${customerName}">
        </form>
        
        <script>
          // Auto-submit form after 2 seconds
          setTimeout(() => {
            document.getElementById('cmiForm').submit();
          }, 2000);
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Verify CMI callback response
   */
  static verifyCallback(callbackData: any): boolean {
    try {
      const { 
        clientid, 
        oid, 
        AuthCode, 
        ProcReturnCode, 
        Response,
        mdStatus,
        HASH,
        amount
      } = callbackData;

      // Check if payment was successful
      if (ProcReturnCode === "00" && Response === "Approved" && mdStatus === "1") {
        // Verify hash (implement according to CMI documentation)
        const expectedHash = this.generateCallbackHash(callbackData);
        return HASH === expectedHash;
      }
      
      return false;
    } catch (error) {
      console.error('CMI callback verification error:', error);
      return false;
    }
  }

  private static generateCallbackHash(data: any): string {
    // Implement CMI callback hash verification
    // Check CMI documentation for exact hash calculation
    return ""; // Placeholder
  }
}