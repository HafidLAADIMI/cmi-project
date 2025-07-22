import {
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Simple order type
export interface FirebaseOrder {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: string;
  paymentStatus: string;
  total: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  createdAt: Date;
  notes?: string;
}

/**
 * Get ALL orders first (for debugging)
 */
export const getAllOrders = async (): Promise<FirebaseOrder[]> => {
  try {
    console.log('🔥 Loading ALL orders from Firebase (debug mode)...');
    
    // Simple query without filters first
    const ordersQuery = collectionGroup(db, 'orders');
    const snapshot = await getDocs(ordersQuery);
    
    console.log(`📊 Total documents found: ${snapshot.docs.length}`);
    
    const orders: FirebaseOrder[] = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`📄 Document ${doc.id}:`, data);
      
      // Extract userId from document path
      const pathSegments = doc.ref.path.split('/');
      const userId = pathSegments[1];
      
      return {
        id: doc.id,
        userId,
        customerName: data.customerName || 'Unknown Customer',
        customerPhone: data.phoneNumber || data.customerPhone || '',
        address: data.address || data.deliveryAddress || '',
        status: data.status || 'pending',
        paymentStatus: data.paymentStatus || 'unpaid',
        total: Number(data.total || data.grandTotal || 0),
        items: (data.items || []).map(item => ({
          id: item.id || item.productId || '',
          name: item.name || 'Unknown Item',
          price: Number(item.price || item.priceAtPurchase || 0),
          quantity: Number(item.quantity || 1)
        })),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        notes: data.notes || data.additionalNote || ''
      };
    });

    console.log(`✅ Processed ${orders.length} orders`);
    orders.forEach(order => {
      console.log(`📦 Order ${order.id}: ${order.customerName} - ${order.status}/${order.paymentStatus} - ${order.total}₺`);
    });
    
    return orders;

  } catch (error) {
    console.error('❌ Error loading ALL orders:', error);
    return [];
  }
};

/**
 * Get pending orders with simple filtering
 */
export const getPendingOrders = async (): Promise<FirebaseOrder[]> => {
  try {
    console.log('🔥 Loading pending orders from Firebase...');
    
    // First try to get all orders, then filter in code
    const allOrders = await getAllOrders();
    
    // Filter in JavaScript instead of Firestore query
    const pendingOrders = allOrders.filter(order => 
      order.status === 'pending' && order.paymentStatus === 'unpaid'
    );
    
    console.log(`✅ Found ${pendingOrders.length} pending orders out of ${allOrders.length} total`);
    return pendingOrders;

  } catch (error) {
    console.error('❌ Error loading pending orders:', error);
    return [];
  }
};

/**
 * Get orders from specific user (for testing)
 */
export const getOrdersFromUser = async (userId: string): Promise<FirebaseOrder[]> => {
  try {
    console.log(`🔥 Loading orders from user ${userId}...`);
    
    const userOrdersRef = collection(db, 'users', userId, 'orders');
    const snapshot = await getDocs(userOrdersRef);
    
    console.log(`📊 Found ${snapshot.docs.length} orders for user ${userId}`);
    
    const orders: FirebaseOrder[] = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`📄 User order ${doc.id}:`, data);
      
      return {
        id: doc.id,
        userId,
        customerName: data.customerName || 'Unknown Customer',
        customerPhone: data.phoneNumber || data.customerPhone || '',
        address: data.address || data.deliveryAddress || '',
        status: data.status || 'pending',
        paymentStatus: data.paymentStatus || 'unpaid',
        total: Number(data.total || data.grandTotal || 0),
        items: (data.items || []).map(item => ({
          id: item.id || item.productId || '',
          name: item.name || 'Unknown Item',
          price: Number(item.price || item.priceAtPurchase || 0),
          quantity: Number(item.quantity || 1)
        })),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        notes: data.notes || data.additionalNote || ''
      };
    });

    return orders;

  } catch (error) {
    console.error(`❌ Error loading orders from user ${userId}:`, error);
    return [];
  }
};

/**
 * Update order status after payment
 */
export const updateOrderPaymentStatus = async (
  userId: string,
  orderId: string,
  success: boolean,
  cmiOrderId?: string
): Promise<boolean> => {
  try {
    console.log(`🔥 Updating order ${orderId} payment status...`);
    
    const orderRef = doc(db, 'users', userId, 'orders', orderId);
    
    const updateData = {
      status: success ? 'confirmed' : 'cancelled',
      paymentStatus: success ? 'paid' : 'failed',
      updatedAt: serverTimestamp(),
      ...(cmiOrderId && { cmiOrderId }),
      ...(success && { paidAt: serverTimestamp() })
    };

    await updateDoc(orderRef, updateData);
    
    console.log(`✅ Order ${orderId} updated successfully`);
    return true;

  } catch (error) {
    console.error('❌ Error updating order:', error);
    return false;
  }
};