import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';

interface OrderItem {
  productId?: string;
  id?: string;
  name: string;
  quantity: number;
  priceAtPurchase?: number;
  price?: number;
  selectedAddons?: any[];
  selectedVariations?: any[];
  itemSubtotal?: number;
  subtotal?: number;
  image?: string;
  variations?: any[];
  addons?: any[];
}

interface Order {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  customerName?: string;
  customerPhone?: string;
  phoneNumber?: string;
  address?: string;
  region?: string;
  shippingAddress?: any;
  deliveryInstructions?: string;
  orderNotes?: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  total?: number;
  grandTotal?: number;
  subtotal?: number;
  subTotalAmount?: number;
  deliveryFee?: number;
  tipAmount?: number;
  tipValue?: number;
  items: OrderItem[];
  notes?: string;
  additionalNote?: string;
  date?: Date;
  createdAt?: any;
  updatedAt?: any;
  restaurantId?: string;
  cuisineName?: string;
  orderType?: string;
  deliveryOption?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface OrderDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
  order: Order | null;
  loading?: boolean;
}

const { height } = Dimensions.get('window');

export function OrderDetailModal({ 
  isVisible, 
  onClose, 
  onConfirmPayment, 
  order,
  loading = false 
}: OrderDetailModalProps) {
  
  if (!order) return null;

  // Helper functions to get the right data - make sure everything returns strings
  const getCustomerName = () => {
    const name = order.customerName || order.userName || order.userEmail || 'N/A';
    return typeof name === 'string' ? name : String(name);
  };
  
  const getCustomerPhone = () => {
    const phone = order.customerPhone || order.phoneNumber || 'N/A';
    return typeof phone === 'string' ? phone : String(phone);
  };
  
  const getAddress = () => {
    // Handle case where address is an object
    if (order.address && typeof order.address === 'object') {
      if (order.address.address) return String(order.address.address);
      if (order.address.region) return String(order.address.region);
      return "Aucune adresse reçue, appelez le client";
    }
    if (order.address && typeof order.address === 'string') return order.address;
    return "Aucune adresse reçue, appelez le client";
  };
  
  const getRegion = () => {
    // Handle case where region might be in address object or separate field
    if (order.region && typeof order.region === 'string') return order.region;
    if (order.address && typeof order.address === 'object' && order.address.region) {
      return String(order.address.region);
    }
    return "Aucune région reçue, appelez le client";
  };
  
  const getNotes = () => {
    const notes = order.notes || order.orderNotes || order.additionalNote || '';
    return typeof notes === 'string' ? notes : String(notes);
  };
  
  const getTotal = () => Number(order.total || order.grandTotal || 0);
  const getSubtotal = () => Number(order.subtotal || order.subTotalAmount || 0);
  const getDeliveryFee = () => Number(order.deliveryFee || 0);
  const getTipAmount = () => Number(order.tipAmount || order.tipValue || 0);

  return (
    <Modal 
      visible={isVisible} 
      transparent 
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'flex-end' 
      }}>
        <View style={{ 
          backgroundColor: 'white', 
          borderTopLeftRadius: 20, 
          borderTopRightRadius: 20,
          maxHeight: height * 0.9,
          minHeight: height * 0.75
        }}>
          {/* Header */}
          <View style={{ 
            padding: 20, 
            borderBottomWidth: 1, 
            borderBottomColor: '#e5e7eb',
            alignItems: 'center'
          }}>
            <View style={{ 
              width: 40, 
              height: 4, 
              backgroundColor: '#d1d5db', 
              borderRadius: 2,
              marginBottom: 15 
            }} />
            <Text style={{ 
              fontSize: 20, 
              fontWeight: 'bold', 
              color: '#111827',
              marginBottom: 5
            }}>
              Détails de la Commande
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: '#6b7280' 
            }}>
              #{order.id.slice(-6)}
            </Text>
          </View>

          {/* Content */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ padding: 20 }}>
              
              {/* Customer Info */}
              <View style={{ 
                backgroundColor: '#dbeafe', 
                borderRadius: 15, 
                padding: 15, 
                marginBottom: 20 
              }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: 'bold', 
                  color: '#111827', 
                  marginBottom: 10 
                }}>
                  👤 Informations Client
                </Text>
                <Text style={{ color: '#374151', marginBottom: 5 }}>
                  <Text style={{ fontWeight: '600' }}>Nom: </Text>
                  {getCustomerName()}
                </Text>
                <Text style={{ color: '#374151', marginBottom: 5 }}>
                  <Text style={{ fontWeight: '600' }}>Téléphone: </Text>
                  {getCustomerPhone()}
                </Text>
                <Text style={{ color: '#374151', marginBottom: 5 }}>
                  <Text style={{ fontWeight: '600' }}>Adresse: </Text>
                  {getAddress()}
                </Text>
                <Text style={{ color: '#374151' }}>
                  <Text style={{ fontWeight: '600' }}>Region: </Text>
                  {getRegion()}
                </Text>
              </View>

              {/* Items */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: 'bold', 
                  color: '#111827', 
                  marginBottom: 15 
                }}>
                  📦 Articles Commandés ({order.items.length})
                </Text>
                
                {order.items.map((item, index) => {
                  const itemPrice = item.priceAtPurchase || item.price || 0;
                  const itemSubtotal = item.itemSubtotal || item.subtotal || (itemPrice * item.quantity);
                  const variations = item.selectedVariations || item.variations || [];
                  const addons = item.selectedAddons || item.addons || [];
                  
                  return (
                    <View key={index} style={{ 
                      backgroundColor: '#f9fafb', 
                      borderRadius: 10, 
                      padding: 15, 
                      marginBottom: 10 
                    }}>
                      <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start' 
                      }}>
                        <Text style={{ 
                          flex: 1, 
                          fontWeight: '500', 
                          color: '#111827', 
                          fontSize: 15 
                        }}>
                          {item.quantity}x {String(item.name || 'Item sans nom')}
                        </Text>
                        <Text style={{ 
                          fontWeight: 'bold', 
                          color: '#2563eb', 
                          fontSize: 15 
                        }}>
                          {itemSubtotal.toFixed(2)} DH
                        </Text>
                      </View>
                      
                      {/* Show unit price */}
                      {itemPrice > 0 && (
                        <Text style={{ 
                          fontSize: 12, 
                          color: '#6b7280',
                          marginTop: 4
                        }}>
                          Prix unitaire: {itemPrice.toFixed(2)} DH
                        </Text>
                      )}
                      
                      {/* Variations */}
                      {variations.length > 0 && (
                        <View style={{ marginTop: 8 }}>
                          {variations.map((variation, vIndex) => {
                            const varName = variation?.name || variation;
                            const displayName = typeof varName === 'string' ? varName : String(varName);
                            const varPrice = variation?.price;
                            
                            return (
                              <Text key={vIndex} style={{ 
                                fontSize: 13, 
                                color: '#6b7280' 
                              }}>
                                • {displayName}
                                {varPrice && ` (+${Number(varPrice).toFixed(2)} DH)`}
                              </Text>
                            );
                          })}
                        </View>
                      )}
                      
                      {/* Addons */}
                      {addons.length > 0 && (
                        <View style={{ marginTop: 5 }}>
                          {addons.map((addon, aIndex) => {
                            const addonName = addon?.name || addon;
                            const displayName = typeof addonName === 'string' ? addonName : String(addonName);
                            const addonPrice = addon?.price;
                            
                            return (
                              <Text key={aIndex} style={{ 
                                fontSize: 13, 
                                color: '#6b7280' 
                              }}>
                                + {displayName}
                                {addonPrice && ` (+${Number(addonPrice).toFixed(2)} DH)`}
                              </Text>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Notes */}
              {getNotes() && (
                <View style={{ 
                  backgroundColor: '#fef3c7', 
                  borderRadius: 15, 
                  padding: 15, 
                  marginBottom: 20 
                }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: 'bold', 
                    color: '#111827', 
                    marginBottom: 8 
                  }}>
                    💬 Notes
                  </Text>
                  <Text style={{ color: '#374151' }}>{getNotes()}</Text>
                </View>
              )}

              {/* Total */}
              <View style={{ 
                backgroundColor: '#dcfce7', 
                borderRadius: 15, 
                padding: 15,
                marginBottom: 20
              }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: 'bold', 
                  color: '#111827', 
                  marginBottom: 15 
                }}>
                  💰 Récapitulatif
                </Text>
                
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  marginBottom: 8 
                }}>
                  <Text style={{ color: '#374151' }}>Sous-total:</Text>
                  <Text style={{ fontWeight: '500', color: '#111827' }}>
                    {getSubtotal().toFixed(2)} DH
                  </Text>
                </View>
                
                {getDeliveryFee() > 0 && (
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    marginBottom: 8 
                  }}>
                    <Text style={{ color: '#374151' }}>Frais de livraison:</Text>
                    <Text style={{ fontWeight: '500', color: '#111827' }}>
                      {getDeliveryFee().toFixed(2)} DH
                    </Text>
                  </View>
                )}
                
                {getTipAmount() > 0 && (
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    marginBottom: 8 
                  }}>
                    <Text style={{ color: '#374151' }}>Pourboire:</Text>
                    <Text style={{ fontWeight: '500', color: '#111827' }}>
                      {getTipAmount().toFixed(2)} DH
                    </Text>
                  </View>
                )}
                
                <View style={{ 
                  borderTopWidth: 1, 
                  borderTopColor: '#d1d5db', 
                  paddingTop: 8, 
                  marginTop: 8 
                }}>
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between' 
                  }}>
                    <Text style={{ 
                      fontSize: 18, 
                      fontWeight: 'bold', 
                      color: '#111827' 
                    }}>
                      Total:
                    </Text>
                    <Text style={{ 
                      fontSize: 20, 
                      fontWeight: 'bold', 
                      color: '#059669' 
                    }}>
                      {getTotal().toFixed(2)} DH
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Buttons */}
          <View style={{ 
            borderTopWidth: 1, 
            borderTopColor: '#e5e7eb', 
            padding: 20,
            backgroundColor: 'white'
          }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={onClose}
                style={{ 
                  flex: 1, 
                  backgroundColor: '#e5e7eb', 
                  paddingVertical: 16, 
                  borderRadius: 12, 
                  alignItems: 'center' 
                }}
              >
                <Text style={{ 
                  color: '#374151', 
                  fontWeight: 'bold', 
                  fontSize: 16 
                }}>
                  Annuler
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={onConfirmPayment}
                disabled={loading}
                style={{ 
                  flex: 2, 
                  backgroundColor: loading ? '#9ca3af' : '#059669', 
                  paddingVertical: 16, 
                  paddingHorizontal: 8,
                  borderRadius: 12, 
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ 
                      width: 16, 
                      height: 16, 
                      borderWidth: 2, 
                      borderColor: 'white', 
                      borderTopColor: 'transparent', 
                      borderRadius: 8, 
                      marginRight: 8 
                    }} />
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
                      Traitement...
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16, marginRight: 6 }}>🖨️</Text>
                    <Text style={{ 
                      color: 'white', 
                      fontWeight: 'bold', 
                      fontSize: 14,
                      textAlign: 'center',
                      flexShrink: 1
                    }}>
                      Encaisser & Imprimer
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}