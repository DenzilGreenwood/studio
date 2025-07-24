/**
 * Browser Console Test Script for Signup Form
 * 
 * This script can be run in the browser's developer console to test the signup form
 * Copy and paste this into the browser console on the signup page (http://localhost:3000/signup)
 */

// Test data for signup
const testSignupData = {
  email: `test.user.${Date.now()}@example.com`,
  password: 'TestPassword123!',
  passphrase: 'MySecureTestPassphrase123!@#$%^&*()',
  confirmPassphrase: 'MySecureTestPassphrase123!@#$%^&*()',
  pseudonym: 'TestUser'
};

console.log('🧪 Browser Console Signup Test');
console.log('📧 Test email:', testSignupData.email);

// Function to fill form and submit
function testSignupForm() {
  try {
    console.log('1. Looking for form elements...');
    
    // Find form inputs
    const emailInput = document.querySelector('input[name="email"], input[placeholder*="example.com"]');
    const passwordInput = document.querySelector('input[name="password"], input[type="password"]:not([placeholder*="passphrase"])');
    const passphraseInput = document.querySelector('input[name="passphrase"], input[placeholder*="passphrase"]:not([placeholder*="confirm"])');
    const confirmPassphraseInput = document.querySelector('input[name="confirmPassphrase"], input[placeholder*="Confirm"]');
    const pseudonymInput = document.querySelector('input[name="pseudonym"], input[placeholder*="pseudonym"]');
    const submitButton = document.querySelector('button[type="submit"]');
    
    if (!emailInput || !passwordInput || !passphraseInput || !confirmPassphraseInput) {
      console.error('❌ Could not find all required form inputs');
      console.log('Available inputs:', {
        email: !!emailInput,
        password: !!passwordInput, 
        passphrase: !!passphraseInput,
        confirmPassphrase: !!confirmPassphraseInput,
        pseudonym: !!pseudonymInput,
        submitButton: !!submitButton
      });
      return;
    }
    
    console.log('✅ Found all form elements');
    
    console.log('2. Filling form with test data...');
    
    // Fill the form
    emailInput.value = testSignupData.email;
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    passwordInput.value = testSignupData.password;
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    passphraseInput.value = testSignupData.passphrase;
    passphraseInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    confirmPassphraseInput.value = testSignupData.confirmPassphrase;
    confirmPassphraseInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    if (pseudonymInput) {
      pseudonymInput.value = testSignupData.pseudonym;
      pseudonymInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    console.log('✅ Form filled with test data');
    
    console.log('3. Form values verification:');
    console.log('   Email:', emailInput.value);
    console.log('   Password:', passwordInput.value ? '***filled***' : 'empty');
    console.log('   Passphrase:', passphraseInput.value ? '***filled***' : 'empty');
    console.log('   Confirm Passphrase:', confirmPassphraseInput.value ? '***filled***' : 'empty');
    console.log('   Pseudonym:', pseudonymInput ? pseudonymInput.value : 'not found');
    
    console.log('4. Ready to submit form!');
    console.log('💡 You can now click the Sign Up button or run submitButton.click() to test the submission');
    
    // Optional: Auto-submit after a delay
    console.log('⏱️ Auto-submitting in 3 seconds... (you can cancel if needed)');
    setTimeout(() => {
      if (submitButton && !submitButton.disabled) {
        console.log('🚀 Submitting form...');
        submitButton.click();
      } else {
        console.log('❌ Submit button not available or disabled');
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error in signup test:', error);
  }
}

// Run the test
testSignupForm();
