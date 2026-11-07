import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export function signInWithGoogle(auth) {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}
