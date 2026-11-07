import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase.js';

function requireFunctions() {
  if (!functions) throw new Error('Firebase Functions is not configured.');
  return functions;
}

export async function requestEmailLoginCode(email) {
  const requestCode = httpsCallable(requireFunctions(), 'requestEmailCode');
  await requestCode({ email });
}

export async function verifyEmailLoginCode(email, code) {
  const verifyCode = httpsCallable(requireFunctions(), 'verifyEmailCode');
  const result = await verifyCode({ email, code });
  if (typeof result.data?.token !== 'string' || !result.data.token) {
    throw new Error('Email code verification did not return an authentication token.');
  }
  return result.data.token;
}
