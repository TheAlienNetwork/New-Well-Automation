/**
 * Self-signed certificate generator for development purposes
 * DO NOT use these certificates in production!
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Create certs directory if it doesn't exist
const certsDir = path.join(process.cwd(), "certs");
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

const keyPath = path.join(certsDir, "key.pem");
const certPath = path.join(certsDir, "cert.pem");

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log("SSL certificates already exist in the certs directory.");
  console.log("To regenerate them, delete the existing files first.");
  process.exit(0);
}

console.log("Generating self-signed SSL certificate for development...");

try {
  // Generate a self-signed certificate valid for 365 days
  execSync(
    `openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"`,
  );

  console.log("Self-signed SSL certificate generated successfully!");
  console.log(`Private key: ${keyPath}`);
  console.log(`Certificate: ${certPath}`);
  console.log(
    "\nWARNING: This is a self-signed certificate for development purposes only.",
  );
  console.log(
    "For production use, obtain a proper certificate from a trusted Certificate Authority.",
  );
} catch (error) {
  console.error("Failed to generate SSL certificate:", error.message);
  console.error("\nMake sure OpenSSL is installed and available in your PATH.");
  console.error(
    "You can manually generate certificates using OpenSSL and place them in the certs directory.",
  );
}
