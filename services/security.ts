
export const LOCKOUT_PROFILE_MS = 2 * 60 * 60 * 1000; // 2 hours
export const LOCKOUT_GENERAL_MS = 1 * 60 * 1000; // 1 minute
export const MAX_ATTEMPTS = 3;

// Hashes for valid codes (Obfuscated Base64 Reverse)
// This method is used instead of SHA-256 to ensure compatibility across all environments (HTTP/HTTPS)
export const verifyCode = async (input: string): Promise<boolean> => {
  if (!input) return false;
  const cleanInput = input.trim();
  
  try {
    // 1. Reverse the string
    const reversed = cleanInput.split('').reverse().join('');
    // 2. Base64 encode
    const encoded = btoa(reversed);
    
    // Valid Obfuscated Keys:
    // KaceDEV -> VEDecaK -> VkVEZWNhSw==
    // KACEDEV -> VEDECAK -> VkVERUNBSw==
    // VIP100  -> 001PIV -> MDAxUElW
    
    const VALID_HASHES = [
      "VkVEZWNhSw==", // KaceDEV
      "VkVERUNBSw==", // KACEDEV
      "MDAxUElW"      // VIP100
    ];
    
    return VALID_HASHES.includes(encoded);
  } catch (e) {
    console.error("Verification error", e);
    return false;
  }
};

export const getSecurityState = () => {
  const attempts = parseInt(localStorage.getItem('sec_attempts') || '0');
  const lockoutTime = parseInt(localStorage.getItem('sec_lockout') || '0');
  const isUnlocked = localStorage.getItem('sec_unlocked') === 'true';
  const promptGenCount = parseInt(localStorage.getItem('sec_prompt_count') || '0');

  const now = Date.now();
  let remainingTime = 0;

  if (lockoutTime > 0) {
    if (now < lockoutTime) {
      remainingTime = lockoutTime - now;
    } else {
      // Lockout expired
      localStorage.removeItem('sec_lockout');
      localStorage.setItem('sec_attempts', '0');
    }
  }

  return {
    attempts,
    isLocked: remainingTime > 0,
    remainingTime,
    isUnlocked,
    promptGenCount
  };
};

export const recordFailedAttempt = (context: 'PROFILE' | 'PROMPT_GEN' = 'PROMPT_GEN') => {
  let attempts = parseInt(localStorage.getItem('sec_attempts') || '0');
  attempts += 1;
  localStorage.setItem('sec_attempts', attempts.toString());

  if (attempts >= MAX_ATTEMPTS) {
    // Differential Lockout Duration
    // If context is PROFILE -> 2 hours
    // Otherwise (Prompt Gen limit) -> 1 minute
    const duration = context === 'PROFILE' ? LOCKOUT_PROFILE_MS : LOCKOUT_GENERAL_MS;
    
    const lockoutEnd = Date.now() + duration;
    localStorage.setItem('sec_lockout', lockoutEnd.toString());
    return { locked: true, remaining: duration };
  }
  
  return { locked: false, remaining: 0 };
};

export const unlockSession = () => {
  localStorage.setItem('sec_unlocked', 'true');
  localStorage.removeItem('sec_attempts');
  localStorage.removeItem('sec_lockout');
};

export const incrementPromptGenUsage = () => {
  let count = parseInt(localStorage.getItem('sec_prompt_count') || '0');
  count += 1;
  localStorage.setItem('sec_prompt_count', count.toString());
  return count;
};
