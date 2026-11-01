import { useCallback, useEffect, useRef, useState } from 'react';

export default function useToast(duration = 2400) {
  const [message, setMessage] = useState('');
  const timer = useRef();
  const showToast = useCallback(text => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(''), duration);
  }, [duration]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [message, showToast];
}
