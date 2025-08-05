import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
// It's better to handle the absence of react-native-device-info gracefully
let DeviceInfo: any = null;
try {
  DeviceInfo = require('react-native-device-info');
} catch (e) {
  console.log("react-native-device-info is not installed. Device detection will be limited.");
}

// Assume CONFIG is imported from your constants
const CONFIG = {
  FEATURES: {
    HAPTIC_FEEDBACK: true,
  }
};


export interface ReceiptData {
  orderId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  paymentMethod: string;
  timestamp: Date;
  customerInfo?: {
    name: string;
    email: string;
  };
  storeInfo?: {
    name: string;
    address: string;
    phone: string;
    taxId?: string;
  };
}

export interface PrinterStatus {
  isConnected: boolean;
  paperStatus: 'ok' | 'low' | 'empty' | 'unknown';
  temperature: 'normal' | 'high' | 'unknown';
  batteryLevel?: number;
  deviceType: 'sunmi' | 'regular' | 'unknown';
  rawStatus?: any; // For debugging
  error?: string; // For debugging
}

class PrinterService {
  private isInitialized = false;
  private SunmiPrinter: any = null;
  private deviceType: 'sunmi' | 'regular' | 'unknown' = 'unknown';
  private simulationMode = false;

  private async detectDeviceType(): Promise<'sunmi' | 'regular' | 'unknown'> {
    if (Platform.OS !== 'android') {
      console.log('📱 Platform is not Android. Activating simulation mode.');
      return 'regular';
    }

    if (!DeviceInfo) {
        console.warn('⚠️ react-native-device-info not available. Cannot determine if device is Sunmi. Assuming regular device.');
        return 'regular';
    }

    try {
      const brand = await DeviceInfo.getBrand();
      const model = await DeviceInfo.getModel();
      
      console.log(`📱 Device Info: Brand=[${brand}], Model=[${model}]`);
      
      if (brand?.toLowerCase().includes('sunmi') || model?.toLowerCase().includes('sunmi')) {
        console.log('✅ Sunmi device detected!');
        return 'sunmi';
      }
      
      console.log('📱 Regular Android phone detected.');
      return 'regular';
    } catch (error) {
      console.error('❌ Error detecting device type:', error);
      return 'unknown';
    }
  }

  private async loadSunmiModule(): Promise<boolean> {
    if (this.deviceType !== 'sunmi') {
      console.log('⏩ Not a Sunmi device, skipping module load.');
      return false;
    }

    try {
      console.log('🔄 Attempting to load Sunmi Printer Library...');
      // This is the critical part. If it fails, we need to know why.
      const SunmiModule = require('@mitsuharu/react-native-sunmi-printer-library');
      this.SunmiPrinter = SunmiModule.default || SunmiModule;

      if (!this.SunmiPrinter || typeof this.SunmiPrinter.init !== 'function') {
          console.error('❌ CRITICAL: Sunmi module loaded, but it is invalid or not a constructor.');
          console.error('   This usually means the native module was not linked correctly during the build.');
          this.SunmiPrinter = null;
          return false;
      }
      
      await this.SunmiPrinter.init();
      console.log('✅ Sunmi module loaded and initialized successfully.');
      return true;

    } catch (loadError) {
      console.error('❌ CRITICAL: Failed to load or initialize Sunmi module.', loadError);
      console.error('   This is the main reason printing fails. It means the native code is missing from your build.');
      console.error('   Ensure the library is in package.json and you have a config plugin for EAS build.');
      this.SunmiPrinter = null;
      return false;
    }
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
        console.log('✅ Printer service already initialized.');
        return true;
    }
    console.log('🖨️ === INITIALIZING PRINTER SERVICE ===');
    
    this.deviceType = await this.detectDeviceType();
    
    if (this.deviceType === 'sunmi') {
      const sunmiLoaded = await this.loadSunmiModule();
      if (!sunmiLoaded) {
        console.warn('⚠️ Sunmi module failed to load. Forcing SIMULATION MODE.');
        this.simulationMode = true;
      } else {
        console.log('✅ Running in REAL printing mode.');
        this.simulationMode = false;
      }
    } else {
      console.log('📱 Activating SIMULATION MODE for non-Sunmi device.');
      this.simulationMode = true;
    }
    
    this.isInitialized = true;
    console.log(`🖨️ === INITIALIZATION COMPLETE ===`);
    console.log(`   - Final Status: ${this.simulationMode ? 'SIMULATION  simulate' : 'REAL print'}`);
    return true;
  }

  async printReceipt(receiptData: ReceiptData): Promise<boolean> {
    console.log(`🖨️ === STARTING PRINT JOB: ${receiptData.orderId} ===`);
    
    if (!this.isInitialized) {
      const initSuccess = await this.initialize();
      if (!initSuccess) {
        console.error('❌ Aborting print job: Service initialization failed.');
        return false;
      }
    }

    if (this.simulationMode || !this.SunmiPrinter) {
        console.log("🖨️ Running in SIMULATION mode.");
        await this.printSimulation(receiptData);
        return true; // In simulation, we consider it a "success"
    }

    try {
      const status = await this.getPrinterStatus();
      console.log('📊 Printer Status:', status);
      
      if (!status.isConnected) throw new Error('Printer is not connected.');
      if (status.paperStatus === 'empty') throw new Error('Out of paper.');

      if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      await this.printReal(receiptData);
      
      if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      console.log('✅ === PRINT JOB SUCCEEDED ===');
      return true;
      
    } catch (error: any) {
      console.error('❌ === PRINT JOB FAILED ===');
      console.error('Error:', error.message);
      
      if (CONFIG.FEATURES.HAPTIC_FEEDBACK) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      return false;
    }
  }

  private async printReal(receiptData: ReceiptData): Promise<void> {
    console.log('🖨️ Sending commands to REAL Sunmi printer...');
    
    // It's safer to wrap each command in a try-catch block
    try {
      await this.SunmiPrinter.setAlignment(1);
      await this.SunmiPrinter.setFontSize(36); // Larger font for title
      await this.SunmiPrinter.printText(`${receiptData.storeInfo?.name || 'AFOUD'}\n`);
      await this.SunmiPrinter.lineWrap(1);

      await this.SunmiPrinter.setAlignment(0);
      await this.SunmiPrinter.setFontSize(24); // Standard font size
      
      const receiptText = this.formatReceiptText(receiptData);
      await this.SunmiPrinter.printText(receiptText);
      
      await this.SunmiPrinter.lineWrap(3);
      await this.SunmiPrinter.cutPaper();
    } catch (error) {
        console.error("❌ A command failed during real print:", error);
        throw error; // Re-throw to be caught by the calling function
    }
  }

  private async printSimulation(receiptData: ReceiptData): Promise<void> {
    console.log('--- VIRTUAL RECEIPT START ---');
    console.log(this.formatReceiptText(receiptData));
    console.log('--- VIRTUAL RECEIPT END ---');
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('✅ Simulation complete.');
  }

  async getPrinterStatus(): Promise<PrinterStatus> {
    if (this.simulationMode || !this.SunmiPrinter) {
      return {
        isConnected: true,
        paperStatus: 'ok',
        temperature: 'normal',
        deviceType: this.deviceType,
      };
    }
    
    try {
      const status = await this.SunmiPrinter.getPrinterStatus();
      return {
        isConnected: true, // If the call succeeds, it's connected
        paperStatus: status.isNoPaper ? 'empty' : 'ok',
        temperature: 'normal', // Library might not provide this
        deviceType: 'sunmi',
        rawStatus: status,
      };
    } catch (error: any) {
      console.error('❌ Failed to get real printer status:', error);
      return {
        isConnected: false,
        paperStatus: 'unknown',
        temperature: 'unknown',
        deviceType: 'sunmi',
        error: error.message,
      };
    }
  }

  private formatReceiptText(receiptData: ReceiptData): string {
    const { orderId, items, total, paymentMethod, timestamp, customerInfo, storeInfo } = receiptData;
    
    let receipt = '';
    
    if (storeInfo) {
      receipt += `${storeInfo.address}\n`;
      receipt += `Tel: ${storeInfo.phone}\n`;
      receipt += '--------------------------------\n';
    }
    
    receipt += `Commande: #${orderId.slice(-6)}\n`;
    receipt += `Date: ${timestamp.toLocaleDateString('fr-FR')} ${timestamp.toLocaleTimeString('fr-FR')}\n`;
    
    if (customerInfo?.name) {
      receipt += `Client: ${customerInfo.name}\n`;
    }
    
    receipt += '================================\n';
    
    items.forEach(item => {
      const itemLine = `${item.quantity}x ${item.name}`;
      const priceLine = `${(item.price * item.quantity).toFixed(2)} DH`;
      const padding = 32 - itemLine.length - priceLine.length;
      receipt += `${itemLine}${' '.repeat(Math.max(1, padding))}${priceLine}\n`;
    });
    
    receipt += '--------------------------------\n';
    
    const totalLabel = "TOTAL:";
    const totalValue = `${total.toFixed(2)} DH`;
    let padding = 32 - totalLabel.length - totalValue.length;
    receipt += `${totalLabel}${' '.repeat(Math.max(1, padding))}${totalValue}\n`;

    const paymentLabel = "Paiement:";
    const paymentValue = `${paymentMethod}`;
    padding = 32 - paymentLabel.length - paymentValue.length;
    receipt += `${paymentLabel}${' '.repeat(Math.max(1, padding))}${paymentValue}\n`;

    receipt += '================================\n';
    receipt += '           MERCI !\n';
    receipt += '      www.afoud.ma\n';
    
    return receipt;
  }
}

export const printerService = new PrinterService();
// Auto-initialize the service when the app loads
printerService.initialize();
