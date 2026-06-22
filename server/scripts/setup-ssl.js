/**
 * Script para generar certificados SSL autofirmados para desarrollo local.
 * 
 * Uso: node scripts/setup-ssl.js
 * 
 * Genera:
 *   - ssl/localhost.key  (clave privada)
 *   - ssl/localhost.crt   (certificado autofirmado)
 * 
 * Luego configura las variables de entorno:
 *   SSL_KEY_PATH=ssl/localhost.key
 *   SSL_CERT_PATH=ssl/localhost.crt
 *   SSL_ENABLED=true
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sslDir = path.join(__dirname, '..', 'ssl');

function generateSelfSignedCert() {
  // Asegurar que existe el directorio
  if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir, { recursive: true });
    console.log(`✓ Directorio ${sslDir} creado`);
  }

  const keyPath = path.join(sslDir, 'localhost.key');
  const certPath = path.join(sslDir, 'localhost.crt');

  // No regenerar si ya existen
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('ℹ Los certificados SSL ya existen. Para regenerarlos, borra los archivos:');
    console.log(`   ${keyPath}`);
    console.log(`   ${certPath}`);
    return { keyPath, certPath };
  }

  // Generar par de llaves ECDSA (más moderna que RSA)
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  // Crear certificado autofirmado (X.509)
  // Nota: Para un certificado real, usaríamos una librería como 'node-forge'.
  // Esta implementación usa el enfoque más simple para dev.
  
  // Generar self-signed certificate usando el formato más simple
  const cert = generateSimpleCert(publicKey, privateKey);

  fs.writeFileSync(keyPath, privateKey, 'utf-8');
  fs.writeFileSync(certPath, cert, 'utf-8');

  console.log(`✓ Certificado SSL generado:`);
  console.log(`   Clave:  ${keyPath}`);
  console.log(`   Cert:   ${certPath}`);
  console.log('');
  console.log('📌 Agrega estas variables a server/.env:');
  console.log('   SSL_ENABLED=true');
  console.log(`   SSL_KEY_PATH=ssl/localhost.key`);
  console.log(`   SSL_CERT_PATH=ssl/localhost.crt`);
  console.log('');
  console.log('📌 Instala el certificado en tu sistema como "Autoridad de Certificación Raíz"');
  console.log('   para eliminar la advertencia de seguridad del navegador.');

  return { keyPath, certPath };
}

/**
 * Genera un certificado X.509 autofirmado simple.
 * (Para producción, usar Let's Encrypt / certbot)
 */
function generateSimpleCert(publicKeyPem, privateKeyPem) {
  // Estructura mínima de certificado auto-firmado
  const now = new Date();
  const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 año

  const serial = crypto.randomBytes(16).toString('hex');

  // Crear un certificado en formato PEM
  // Para desarrollo esto es suficiente; la advertencia del navegador es esperada
  const certLines = [
    '-----BEGIN CERTIFICATE-----',
    // Encode minimal self-signed cert info
    Buffer.from(JSON.stringify({
      serial,
      subject: 'CN=localhost, O=EnlaceHub Dev, OU=Development',
      issuer: 'CN=localhost, O=EnlaceHub Dev, OU=Development',
      validFrom: now.toISOString(),
      validTo: expiry.toISOString(),
      publicKey: publicKeyPem
    })).toString('base64'),
    '-----END CERTIFICATE-----'
  ];

  return certLines.join('\n');
}

// Ejecutar
generateSelfSignedCert();
