# TLS/SSL Support for WITS WebSocket-to-TCP Proxy

## Overview

This document explains how to enable TLS/SSL support for the WITS WebSocket-to-TCP proxy, allowing secure WebSocket connections (wss://) for production environments.

## Why Use TLS/SSL?

Enabling TLS/SSL provides several benefits:

1. **Data Encryption**: All data transmitted between clients and the proxy is encrypted, protecting sensitive drilling data.
2. **Authentication**: Certificates verify the identity of the server, preventing man-in-the-middle attacks.
3. **Integrity**: TLS ensures data hasn't been tampered with during transmission.
4. **Compliance**: Many organizations require encrypted connections for sensitive operational data.

## Setup Instructions

### 1. Generate SSL Certificates

#### For Development (Self-Signed Certificates)

We've included a script to generate self-signed certificates for development:

```bash
node generate-self-signed-cert.js
```

This will create a `certs` directory with `key.pem` and `cert.pem` files.

**Note**: Browsers will show a security warning when using self-signed certificates. You'll need to accept this warning to proceed.

#### For Production

For production environments, obtain a proper certificate from a trusted Certificate Authority (CA) like Let's Encrypt, DigiCert, or Comodo.

Place your certificate files in the `certs` directory or specify their location using environment variables.

### 2. Configure the Proxy

Set the following environment variables to enable TLS/SSL:

```bash
# Enable TLS/SSL
export USE_TLS=true

# Optional: Specify certificate paths if not using default locations
export CERT_PATH=/path/to/your/cert.pem
export KEY_PATH=/path/to/your/key.pem

# Optional: Enable connection multiplexing
export ENABLE_MULTIPLEXING=true
```

### 3. Start the Proxy

```bash
node witsProxy.js
```

The server will start with TLS/SSL enabled, listening for secure WebSocket connections (wss://).

## Client Connection

Clients should connect using the secure WebSocket protocol (wss://):

```
wss://your-server:8080/wits?host=192.168.1.100&port=5000&noralis=true&version=0
```

The client code in `witsConnection.ts` will automatically use wss:// when:
- The page is loaded over HTTPS
- The host is not localhost or a private IP address

## Connection Multiplexing

When enabled, multiple WebSocket clients can share a single TCP connection to the same WITS server. This is useful when multiple users need to monitor the same data source.

Enable multiplexing with:

```bash
export ENABLE_MULTIPLEXING=true
```

## Troubleshooting

### Certificate Issues

If you see errors like "unable to verify the first certificate" or "self-signed certificate", ensure:

1. Your certificate is valid and not expired
2. For production, your certificate is from a trusted CA
3. The certificate's Common Name (CN) or Subject Alternative Name (SAN) matches your server's hostname

### Connection Problems

If clients cannot connect:

1. Verify the server is running with TLS enabled
2. Check that clients are using the correct protocol (wss://)
3. Ensure port 8080 (or your configured port) is open in any firewalls
4. For self-signed certificates, make sure clients have accepted the security warning

## Security Best Practices

1. **Use Strong Certificates**: Use at least 2048-bit RSA or ECC certificates
2. **Implement Authentication**: Consider adding user authentication for the proxy
3. **Regular Updates**: Keep the proxy and its dependencies updated
4. **Firewall Rules**: Restrict access to the proxy server to trusted IP addresses
5. **Certificate Rotation**: Regularly renew your certificates before expiration
