const bcrypt = require('bcryptjs');

// Test password hashing and comparison
const testPassword = 'FARM123@#';
console.log('Testing password:', testPassword);

const hash = bcrypt.hashSync(testPassword, 10);
console.log('Generated hash:', hash);

const isValid = bcrypt.compareSync(testPassword, hash);
console.log('Hash comparison result:', isValid);

// Test with the expected credentials
if (isValid) {
    console.log('✅ Password verification works correctly');
} else {
    console.log('❌ Password verification failed');
}
