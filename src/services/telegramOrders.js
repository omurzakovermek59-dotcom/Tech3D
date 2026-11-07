import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase.js';

function requireFunctions() {
  if (!functions) throw new Error('Firebase Functions is not configured.');
  return functions;
}

export async function notifyTelegramOrder(orderId) {
  const notify = httpsCallable(requireFunctions(), 'notifyTelegramOrder');
  await notify({ orderId });
}

export async function sendQuickTelegramOrder(details) {
  const send = httpsCallable(requireFunctions(), 'sendQuickTelegramOrder');
  return send(details);
}
