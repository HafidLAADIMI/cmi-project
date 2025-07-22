// demo-data.js - Run this in Node.js to create demo data
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAbWRtpnsdDWVOEYjIAHVzDD3I9RbUDzwk",
  authDomain: "sunmi-c3225.firebaseapp.com", 
  projectId: "sunmi-c3225",
  storageBucket: "sunmi-c3225.firebasestorage.app",
  messagingSenderId: "65349522250",
  appId: "1:65349522250:web:f2da38f919adc876f627b3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createDemoData() {
  try {
    console.log('🔥 Creating demo data...');

    // Demo orders
    const demoOrders = [
      {
        id: 'order_001',
        userId: 'user_001',
        customerName: 'John Doe',
        customerPhone: '+90 555 123 4567',
        phoneNumber: '+90 555 123 4567',
        address: 'Kadıköy, İstanbul, Turkey',
        deliveryAddress: 'Kadıköy, İstanbul, Turkey',
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: 'cash_on_delivery',
        total: 125.50,
        grandTotal: 125.50,
        subtotal: 106.36,
        deliveryFee: 15.00,
        tipAmount: 0,
        items: [
          {
            id: 'item_001',
            name: 'Margherita Pizza',
            price: 45.00,
            quantity: 1,
            priceAtPurchase: 45.00
          },
          {
            id: 'item_002', 
            name: 'Caesar Salad',
            price: 32.50,
            quantity: 1,
            priceAtPurchase: 32.50
          },
          {
            id: 'item_003',
            name: 'Coca Cola',
            price: 12.00,
            quantity: 2,
            priceAtPurchase: 12.00
          }
        ],
        notes: 'Please ring the doorbell',
        additionalNote: 'Please ring the doorbell',
        restaurantId: 'restaurant_001',
        cuisineName: 'Italian',
        orderType: 'delivery',
        deliveryOption: 'delivery',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'order_002',
        userId: 'user_002',
        customerName: 'Sarah Johnson',
        customerPhone: '+90 555 987 6543',
        phoneNumber: '+90 555 987 6543',
        address: 'Beşiktaş, İstanbul, Turkey',
        deliveryAddress: 'Beşiktaş, İstanbul, Turkey',
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: 'cash_on_delivery',
        total: 89.75,
        grandTotal: 89.75,
        subtotal: 75.85,
        deliveryFee: 10.00,
        tipAmount: 5.00,
        items: [
          {
            id: 'item_004',
            name: 'Chicken Burger',
            price: 38.50,
            quantity: 1,
            priceAtPurchase: 38.50
          },
          {
            id: 'item_005',
            name: 'French Fries',
            price: 18.75,
            quantity: 1,
            priceAtPurchase: 18.75
          },
          {
            id: 'item_006',
            name: 'Milkshake',
            price: 22.50,
            quantity: 1,
            priceAtPurchase: 22.50
          }
        ],
        notes: 'Extra sauce please',
        additionalNote: 'Extra sauce please',
        restaurantId: 'restaurant_002',
        cuisineName: 'American',
        orderType: 'delivery',
        deliveryOption: 'delivery',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'order_003',
        userId: 'user_003',
        customerName: 'Mehmet Yılmaz',
        customerPhone: '+90 555 456 7890',
        phoneNumber: '+90 555 456 7890',
        address: 'Üsküdar, İstanbul, Turkey',
        deliveryAddress: 'Üsküdar, İstanbul, Turkey',
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: 'cash_on_delivery',
        total: 67.25,
        grandTotal: 67.25,
        subtotal: 57.00,
        deliveryFee: 8.00,
        tipAmount: 2.25,
        items: [
          {
            id: 'item_007',
            name: 'Döner Kebab',
            price: 28.50,
            quantity: 1,
            priceAtPurchase: 28.50
          },
          {
            id: 'item_008',
            name: 'Turkish Tea',
            price: 8.50,
            quantity: 2,
            priceAtPurchase: 8.50
          },
          {
            id: 'item_009',
            name: 'Baklava',
            price: 20.00,
            quantity: 1,
            priceAtPurchase: 20.00
          }
        ],
        notes: 'Second floor, apartment 5',
        additionalNote: 'Second floor, apartment 5',
        restaurantId: 'restaurant_003',
        cuisineName: 'Turkish',
        orderType: 'delivery',
        deliveryOption: 'delivery',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    // Create demo orders
    for (const order of demoOrders) {
      const userRef = doc(db, 'users', order.userId, 'orders', order.id);
      await setDoc(userRef, order);
      console.log(`✅ Created order ${order.id} for ${order.customerName}`);
    }

    console.log('🎉 Demo data created successfully!');
    console.log('📦 Created 3 pending orders ready for payment');

  } catch (error) {
    console.error('❌ Error creating demo data:', error);
  }
}

// Run the script
createDemoData();