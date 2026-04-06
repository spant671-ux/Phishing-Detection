/**
 * PhishGuard - Test Suite
 * Run: node test.js
 */

const API = 'http://localhost:5000';

const testCases = [
  {
    url: 'https://www.google.com',
    content: '',
    expected: 'safe',
  },
  {
    url: 'https://www.github.com',
    content: '',
    expected: 'safe',
  },
  {
    url: 'http://paypal-secure-login.suspicious-domain.tk/verify-account',
    content: 'Verify your PayPal account immediately or it will be suspended. Enter your password and credit card number.',
    expected: 'suspicious/phishing',
  },
  {
    url: 'http://192.168.1.1/@google-security-check',
    content: 'Verify your account immediately. Urgent action required.',
    expected: 'suspicious',
  },
  {
    url: 'http://sub1.sub2.sub3.sub4.example.com/login',
    content: '',
    expected: 'suspicious',
  },
  {
    url: 'http://g00gle-security-alert.xyz/verify-now',
    content: 'Your account will be suspended. Confirm your password now.',
    expected: 'suspicious/phishing',
  },
  {
    url: 'http://xn--goog1e.com/account',
    content: '',
    expected: 'suspicious',
  },
  {
    url: 'http://paypal-login.scam.tk/verify',
    content: 'Enter your password and credit card immediately. Your account will be terminated within 24 hours.',
    expected: 'phishing',
  },
];

async function runTests() {
  console.log('🧪 PhishGuard Test Suite\n');
  console.log('='.repeat(85));

  let passed = 0;
  const total = testCases.length;

  for (const test of testCases) {
    try {
      const res = await fetch(`${API}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: test.url, content: test.content }),
      });

      const result = await res.json();
      const icon =
        result.risk_level === 'safe' ? '✅' :
        result.risk_level === 'suspicious' ? '⚠️ ' : '🚨';

      const matches = test.expected.includes(result.risk_level);
      if (matches) passed++;

      console.log(`\n${matches ? '✓' : '✗'} ${icon} ${result.risk_level.toUpperCase().padEnd(12)} Score: ${String(result.final_score).padStart(3)}%  |  ${test.url}`);
      console.log(`  Expected: ${test.expected} | LLM: ${result.llm_score}% | Rules: ${result.rule_score}% | LLM Online: ${result.llm_available}`);
      if (result.reasons.length > 0) {
        console.log(`  Reasons: ${result.reasons.slice(0, 3).join(' • ')}`);
      }
    } catch (error) {
      console.log(`\n✗ ERROR: ${test.url} — ${error.message}`);
    }
  }
  console.log('\n' + '='.repeat(85));
  console.log(`\n📊 Results: ${passed}/${total} tests matched expected risk level`);
  console.log(`ℹ️  Note: LLM is configured (gemma4) and tests completed. Check individual rows for LLM Online status.\n`);
}

runTests();
