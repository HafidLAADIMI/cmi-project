const { withPlugins, withAndroidManifest } = require('@expo/config-plugins');

const withSunmiPrinter = (config) => {
  // Add necessary permissions for Sunmi devices
  config = withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;
    
    // Add Sunmi printer permissions
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }
    
    const permissions = [
      'com.sunmi.permission.MSR_SERVICE',
      'com.sunmi.permission.CASHBOX_SERVICE', 
      'com.sunmi.permission.PRINTER_SERVICE',
      'com.sunmi.permission.TAX_SETTING',
      'com.sunmi.perm.MSR_SERVICE',
      'com.sunmi.perm.CASHBOX_SERVICE',
      'com.sunmi.perm.PRINTER_SERVICE',
    ];
    
    permissions.forEach(permission => {
      const exists = manifest['uses-permission'].find(p => 
        p.$['android:name'] === permission
      );
      
      if (!exists) {
        manifest['uses-permission'].push({
          $: { 'android:name': permission }
        });
      }
    });
    
    return config;
  });
  
  return config;
};

module.exports = withSunmiPrinter;