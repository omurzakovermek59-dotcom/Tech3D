import { useEffect, useState } from 'react';

export default function CountUp({ value, suffix }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const started = performance.now();
    let frame;
    const update = now => {
      const progress = Math.min((now - started) / 1600, 1);
      setCount(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <b>{count}{count === value ? suffix : ''}</b>;
}
