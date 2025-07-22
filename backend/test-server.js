
import express from "express"
import cors from "cors"
import path from "path"
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock database
const orders = new Map();
const printJobs = [];

// Test CMI Payment Initiation
app.post('/api/cmi/initiate-payment', (req, res) => {
  try {
    const { items, customerInfo } = req.body;
    
    console.log('💳 Payment Request:', { items, customerInfo });
    
    const orderId = `TEST_${Date.now()}`;
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Store order
    orders.set(orderId, {
      id: orderId,
      items,
      customerInfo,
      total,
      status: 'pending',
      createdAt: new Date()
    });
    
    // Return mock payment URL pointing to our test page
    res.json({
      success: true,
      paymentUrl: `http://192.168.1.75:3000/test-payment/${orderId}`,
      orderId
    });
    
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Beautiful Test Payment Page
app.get('/test-payment/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);
  
  if (!order) {
    return res.send('<h1>Order not found</h1>');
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test CMI Payment</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #0ea5e9 0%, #f97316 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                padding: 40px;
                max-width: 400px;
                width: 100%;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #f97316, #ea580c);
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px;
                font-size: 24px;
            }
            .title {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 8px;
            }
            .subtitle {
                color: #6b7280;
                font-size: 14px;
            }
            .amount {
                background: linear-gradient(135deg, #f97316, #ea580c);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-size: 36px;
                font-weight: 800;
                text-align: center;
                margin: 24px 0;
            }
            .order-info {
                background: #f8fafc;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 24px;
                border: 1px solid #e2e8f0;
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 6px;
                font-weight: 600;
                color: #374151;
                font-size: 14px;
            }
            input, select {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                font-size: 16px;
                transition: all 0.2s;
                background: white;
            }
            input:focus, select:focus {
                outline: none;
                border-color: #0ea5e9;
                box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
            }
            .card-row {
                display: flex;
                gap: 12px;
            }
            .btn {
                width: 100%;
                padding: 16px;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin: 8px 0;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            .btn-primary {
                background: linear-gradient(135deg, #0ea5e9, #0284c7);
                color: white;
                box-shadow: 0 4px 14px 0 rgba(14, 165, 233, 0.3);
            }
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px 0 rgba(14, 165, 233, 0.4);
            }
            .btn-secondary {
                background: #f1f5f9;
                color: #475569;
                border: 1px solid #e2e8f0;
            }
            .btn-secondary:hover {
                background: #e2e8f0;
            }
            .test-cards {
                background: linear-gradient(135deg, #fef3c7, #fde68a);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 20px;
                border: 1px solid #f59e0b;
            }
            .test-cards h4 {
                color: #92400e;
                margin-bottom: 8px;
                font-size: 14px;
                font-weight: 600;
            }
            .test-cards p {
                color: #92400e;
                font-size: 12px;
                margin: 4px 0;
            }
            .loading {
                display: none;
                text-align: center;
                padding: 20px;
            }
            .spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #e5e7eb;
                border-top: 3px solid #0ea5e9;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .security {
                display: flex;
                justify-content: space-around;
                margin-top: 20px;
                padding: 16px;
                background: #f0f9ff;
                border-radius: 12px;
                border: 1px solid #bae6fd;
            }
            .security-item {
                text-align: center;
                font-size: 12px;
                color: #0369a1;
            }
            .security-icon {
                font-size: 20px;
                margin-bottom: 4px;
                display: block;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏦</div>
                <h1 class="title">Test Payment Gateway</h1>
                <p class="subtitle">Secure test environment</p>
            </div>

            <div class="amount">${order.total.toFixed(2)} MAD</div>

            <div class="order-info">
                <p><strong>Order:</strong> ${orderId}</p>
                <p><strong>Customer:</strong> ${order.customerInfo?.name || 'Guest'}</p>
                <p><strong>Email:</strong> ${order.customerInfo?.email || 'N/A'}</p>
            </div>

            <div class="test-cards">
                <h4>🧪 Test Cards</h4>
                <p><strong>Success:</strong> 4242 4242 4242 4242</p>
                <p><strong>Decline:</strong> 4000 0000 0000 0002</p>
                <p><strong>3D Secure:</strong> 4000 0000 0000 3220</p>
            </div>

            <div id="paymentForm">
                <div class="form-group">
                    <label>Card Number</label>
                    <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19">
                </div>
                
                <div class="card-row">
                    <div class="form-group" style="flex: 1">
                        <label>Expiry</label>
                        <input type="text" id="expiry" placeholder="MM/YY" maxlength="5">
                    </div>
                    <div class="form-group" style="flex: 1">
                        <label>CVV</label>
                        <input type="text" id="cvv" placeholder="123" maxlength="4">
                    </div>
                </div>

                <div class="form-group">
                    <label>Cardholder Name</label>
                    <input type="text" id="cardName" placeholder="John Doe" value="${order.customerInfo?.name || ''}">
                </div>

                <button class="btn btn-primary" onclick="processPayment()">
                    <span>🔒</span>
                    <span>Pay ${order.total.toFixed(2)} MAD</span>
                </button>

                <button class="btn btn-secondary" onclick="cancelPayment()">
                    <span>❌</span>
                    <span>Cancel Payment</span>
                </button>
            </div>

            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Processing your payment...</p>
            </div>

           
        </div>

        <script>
            // Format card number
            document.getElementById('cardNumber').addEventListener('input', function(e) {
                let value = e.target.value.replace(/\\s/g, '').replace(/[^0-9]/gi, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                if (formattedValue.length <= 19) {
                    e.target.value = formattedValue;
                }
            });

            // Format expiry
            document.getElementById('expiry').addEventListener('input', function(e) {
                let value = e.target.value.replace(/\\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0,2) + '/' + value.substring(2,4);
                }
                e.target.value = value;
            });

            // Only allow numbers for CVV
            document.getElementById('cvv').addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });

            function processPayment() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\\s/g, '');
    const expiry = document.getElementById('expiry').value;
    const cvv = document.getElementById('cvv').value;
    const cardName = document.getElementById('cardName').value;

    // Validation
    if (!cardNumber || cardNumber.length < 16) {
        alert('Please enter a valid card number');
        return;
    }
    if (!expiry || expiry.length < 5) {
        alert('Please enter a valid expiry date');
        return;
    }
    if (!cvv || cvv.length < 3) {
        alert('Please enter a valid CVV');
        return;
    }
    if (!cardName.trim()) {
        alert('Please enter the cardholder name');
        return;
    }

    // Show loading
    document.getElementById('paymentForm').style.display = 'none';
    document.getElementById('loading').style.display = 'block';

    // Simulate payment processing
    setTimeout(() => {
        let success = true;
        
        // Test card logic
        if (cardNumber === '4000000000000002') {
            success = false; // Decline card
        }
        
        // Update order status on server
        fetch('/api/test/update-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: '${orderId}',
                success: success,
                cardNumber: cardNumber.slice(-4)
            })
        });
        
        // NO MORE DEEP LINKS! Just change the URL hash
        if (success) {
            window.location.href = '#success-${orderId}';
        } else {
            window.location.href = '#fail-${orderId}';
        }
    }, 3000);
}

            function cancelPayment() {
                window.location.href = 'cmipaymentapp://payment/fail?orderId=${orderId}';
            }
        </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Update order status (called from payment page)
app.post('/api/test/update-order', (req, res) => {
  const { orderId, success, cardNumber } = req.body;
  const order = orders.get(orderId);
  
  if (order) {
    order.status = success ? 'paid' : 'failed';
    order.paidAt = success ? new Date() : null;
    order.lastFour = cardNumber;
    orders.set(orderId, order);
    
    console.log(`💳 Payment ${success ? 'SUCCESS' : 'FAILED'}: ${orderId}`);
  }
  
  res.json({ success: true });
});

// Check order status
app.get('/api/cmi/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);
  
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
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
});

// Test print receipt
app.post('/api/test/print', (req, res) => {
  const { orderId, receiptData } = req.body;
  
  console.log('🖨️ PRINT REQUEST:');
  console.log('Order ID:', orderId);
  console.log('Receipt Data:', JSON.stringify(receiptData, null, 2));
  
  // Simulate print job
  const printJob = {
    id: `PRINT_${Date.now()}`,
    orderId,
    receiptData,
    status: 'printed',
    printedAt: new Date()
  };
  
  printJobs.push(printJob);
  
  console.log('✅ Receipt printed successfully!');
  console.log('Print Job ID:', printJob.id);
  
  res.json({
    success: true,
    printJobId: printJob.id,
    message: 'Receipt printed successfully'
  });
});

// Get print jobs (for testing)
app.get('/api/test/print-jobs', (req, res) => {
  res.json({
    success: true,
    printJobs: printJobs.slice(-10) // Last 10 print jobs
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Test server running',
    ordersCount: orders.size,
    printJobsCount: printJobs.length,
    timestamp: new Date().toISOString()
  });
});

// Test dashboard (bonus!)
app.get('/dashboard', (req, res) => {
  const allOrders = Array.from(orders.values());
  const recentPrintJobs = printJobs.slice(-5);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Dashboard</title>
        <style>
            body { font-family: system-ui; margin: 40px; background: #f8fafc; }
            .container { max-width: 1200px; margin: 0 auto; }
            .card { background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
            .stat { text-align: center; padding: 16px; background: #f0f9ff; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #0284c7; }
            .stat-label { font-size: 14px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background: #f8fafc; font-weight: 600; }
            .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-failed { background: #fee2e2; color: #991b1b; }
            .status-pending { background: #fef3c7; color: #92400e; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🧪 Test Dashboard</h1>
            
            <div class="card">
                <h2>Statistics</h2>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-value">${allOrders.length}</div>
                        <div class="stat-label">Total Orders</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${allOrders.filter(o => o.status === 'paid').length}</div>
                        <div class="stat-label">Successful Payments</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${printJobs.length}</div>
                        <div class="stat-label">Print Jobs</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${allOrders.reduce((sum, o) => o.status === 'paid' ? sum + o.total : sum, 0).toFixed(2)} MAD</div>
                        <div class="stat-label">Total Revenue</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>Recent Orders</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allOrders.slice(-10).reverse().map(order => `
                            <tr>
                                <td>${order.id}</td>
                                <td>${order.customerInfo?.name || 'Guest'}</td>
                                <td>${order.total.toFixed(2)} MAD</td>
                                <td><span class="status status-${order.status}">${order.status}</span></td>
                                <td>${new Date(order.createdAt).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h2>Recent Print Jobs</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Print ID</th>
                            <th>Order ID</th>
                            <th>Status</th>
                            <th>Printed At</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentPrintJobs.reverse().map(job => `
                            <tr>
                                <td>${job.id}</td>
                                <td>${job.orderId}</td>
                                <td><span class="status status-paid">${job.status}</span></td>
                                <td>${new Date(job.printedAt).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </body>
    </html>
  `;
  
  res.send(html);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Test Server running on port ${PORT}`);
  console.log(`📱 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`💳 Payment: http://localhost:${PORT}/test-payment/ORDER_ID`);
  console.log(`🖨️ Ready for print testing!`);
});