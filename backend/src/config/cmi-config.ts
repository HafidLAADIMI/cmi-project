export const CMI_CONFIG = {
  // ⚠️ REPLACE WITH YOUR REAL CMI CREDENTIALS
  CLIENT_ID: "YOUR_CMI_CLIENT_ID", // Get from CMI
  STORE_KEY: "YOUR_CMI_STORE_KEY", // Get from CMI
  
  // CMI URLs
  TEST_URL: "https://testpayment.cmi.com.tr/fim/est3Dgate",
  PROD_URL: "https://payment.cmi.com.tr/fim/est3Dgate",
  
  // Your app URLs
  OK_URL: "https://yourbackend.com/cmi/success",
  FAIL_URL: "https://yourbackend.com/cmi/fail",
  
  // Payment settings
  CURRENCY: "949", // Turkish Lira
  LANG: "tr",
  STORE_TYPE: "3d_pay", // 3D Secure
  
  // Environment
  IS_TEST: true, // Set to false for production
};