// Simple utility to find your local network IP address
const { networkInterfaces } = require('os');

// Get all network interfaces
const nets = networkInterfaces();
const results = {};

// Find all non-internal IPv4 addresses
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal addresses
    if (net.family === 'IPv4' && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}

console.log('\n=== YOUR LOCAL NETWORK IP ADDRESSES ===');
console.log('Use one of these in your .env.local file for NEXT_PUBLIC_EXTERNAL_URL\n');

// Display all found IP addresses
for (const [interface, addresses] of Object.entries(results)) {
  for (const address of addresses) {
    console.log(`${interface}: ${address}`);
  }
}

console.log('\nUpdate your .env.local file with:');
console.log('NEXT_PUBLIC_EXTERNAL_URL=http://YOUR_IP_HERE:3001');
console.log('\nThen restart your Next.js server\n');