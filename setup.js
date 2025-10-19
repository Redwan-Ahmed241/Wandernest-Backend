#!/usr/bin/env node

/**
 * Visa API Setup Script
 * Run this to set up your environment for the Visa API
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '.env');

// Generate a secure JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('🚀 Visa API Setup Script');
console.log('========================\n');

// Check if .env exists
if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists');

    // Read current .env
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Check if JWT_SECRET is already set
    if (envContent.includes('JWT_SECRET=')) {
        console.log('✅ JWT_SECRET already configured');
    } else {
        // Add JWT_SECRET
        envContent += `\n# JWT Authentication\nJWT_SECRET=${jwtSecret}\n`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Added JWT_SECRET to .env');
    }
} else {
    console.log('❌ .env file not found!');
    console.log('Please create a .env file with your Supabase credentials first.');
    process.exit(1);
}

console.log('\n🎯 Next Steps:');
console.log('1. Run: npm start');
console.log('2. Test: http://localhost:3000/api/visa/v1/health');
console.log('3. Start building your frontend! 🚀');

console.log('\n📚 API Documentation:');
console.log('- Countries: GET /api/visa/v1/countries');
console.log('- Applications: POST /api/visa/v1/applications (needs JWT token)');
console.log('- Health Check: GET /api/visa/v1/health');

console.log('\n🔐 Authentication:');
console.log('- Use JWT tokens in Authorization header');
console.log('- Format: Bearer <your-jwt-token>');

console.log('\n✨ Setup Complete! Your Visa API is ready. 🎉');