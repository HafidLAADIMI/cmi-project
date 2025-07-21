import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { CMIService } from './services/cmi-service.js';

const app = express();
const PORT = 3000;

// Enhanced CORS
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For CMI callbacks

// Mock database
const orders = new Map<string, any>();

// Types
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// ✅ REAL CMI Payment Initiation
app.post('/api/cmi/initiate-payment', (req: Request, res: Response) => {
  try {
    const { items, customerInfo }: { 
      items: OrderItem[], 
      customerInfo?: { name?: string, email?: string } 
    } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid items array'
      });
    }

    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Store order
    orders.set(orderId, { 
      id: orderId, 
      items, 
      total, 
      status: 'pending',
      createdAt: new Date(),
      customerInfo
    });
    
    console.log(`💳 CMI Payment initiated: ${orderId} - ${total.toFixed(2)} TL`);
    
    res.json({
      success: true,
      paymentUrl: `http://192.168.1.75:3000/cmi/payment-form/${orderId}`, // Replace YOUR_IP
      orderId
    });
  } catch (error) {
    console.error('💥 CMI Payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ✅ CMI Payment Form Generator
app.get('/cmi/payment-form/:orderId', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = orders.get(orderId);
    
    if (!order) {
      return res.status(404).send('<h1>Order not found</h1>');
    }
    
    // Generate CMI payment form
    const paymentForm = CMIService.createPaymentForm({
      orderId: order.id,
      amount: order.total,
      customerEmail: order.customerInfo?.email,
      customerName: order.customerInfo?.name,
    });
    
    console.log(`🏦 CMI payment form generated for: ${orderId}`);
    res.send(paymentForm);
    
  } catch (error) {
    console.error('💥 Payment form error:', error);
    res.status(500).send('<h1>Payment form error</h1>');
  }
});

// ✅ CMI Success Callback
app.post('/cmi/success', (req: Request, res: Response) => {
  try {
    console.log('✅ CMI Success callback:', req.body);
    
    const { oid: orderId } = req.body;
    const isValid = CMIService.verifyCallback(req.body);
    
    if (isValid) {
      // Update order status
      const order = orders.get(orderId);
      if (order) {
        order.status = 'paid';
        order.paidAt = new Date();
        order.cmiResponse = req.body;
        orders.set(orderId, order);
        
        console.log(`✅ Payment confirmed: ${orderId}`);
      }
      
      // Redirect back to mobile app
      res.redirect(`cmipaymentapp://payment/success?orderId=${orderId}`);
    } else {
      console.log(`❌ Payment verification failed: ${orderId}`);
      res.redirect(`cmipaymentapp://payment/fail?orderId=${orderId}`);
    }
  } catch (error) {
    console.error('💥 CMI success callback error:', error);
    res.redirect(`cmipaymentapp://payment/fail`);
  }
});

// ✅ CMI Failure Callback
app.post('/cmi/fail', (req: Request, res: Response) => {
  try {
    console.log('❌ CMI Failure callback:', req.body);
    
    const { oid: orderId } = req.body;
    
    // Update order status
    const order = orders.get(orderId);
    if (order) {
      order.status = 'failed';
      order.cmiResponse = req.body;
      orders.set(orderId, order);
    }
    
    // Redirect back to mobile app
    res.redirect(`cmipaymentapp://payment/fail?orderId=${orderId}`);
  } catch (error) {
    console.error('💥 CMI failure callback error:', error);
    res.redirect(`cmipaymentapp://payment/fail`);
  }
});

// Order status check
app.get('/api/cmi/orders/:orderId/status', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = orders.get(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }
    
    res.json({ 
      success: true, 
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        paidAt: order.paidAt
      }
    });
  } catch (error) {
    console.error('💥 Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    version: '2.0.0',
    cmi: 'Real CMI Integration Ready',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Real CMI Payment Backend running on:`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://0.0.0.0:${PORT}`);
  console.log(`🏦 CMI Ready: Configure your credentials in cmi-config.ts`);
  console.log(`⚠️  Remember to update YOUR_IP in payment URLs`);
});

export default app;