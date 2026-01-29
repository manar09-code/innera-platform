# Device Control System Documentation

## Overview
The device control system tracks unique devices per user and detects new device logins. This enables automation workflows when users access the platform from unrecognized devices.

## Implementation Details

### Device ID Generation
- Each device gets a unique ID generated once and stored in localStorage
- Format: `device_${timestamp}_${randomString}`
- Persists across browser sessions on the same device

### Firestore Structure
```
users/{userId}/devices/{deviceId}
```

### Device Document Fields
- `deviceId`: Unique identifier for the device
- `deviceName`: Browser user agent string
- `lastLogin`: ISO timestamp of last login
- `newDeviceDetected`: Boolean flag set to `true` for new devices

## Login Flow
1. User attempts login
2. Check if device exists in Firestore at `users/{uid}/devices/{deviceId}`
3. If device exists:
   - Update `lastLogin` timestamp
4. If device does not exist:
   - Create new device document with `newDeviceDetected: true`
   - This triggers automation workflows

## Make AI Integration
To connect this to Make AI:

1. Create a Firestore trigger in Make AI
2. Watch for document creation/updates in `users/{userId}/devices/{deviceId}`
3. Filter for documents where `newDeviceDetected == true`
4. Use the device information for your automation workflow

## Testing
- Login from a new device/browser/incognito mode
- Check Firestore for new device document with `newDeviceDetected: true`
- Subsequent logins from same device should only update `lastLogin`

## Security Notes
- Device ID is client-side generated and stored in localStorage
- Consider implementing device verification for sensitive operations
- Monitor for suspicious device patterns
