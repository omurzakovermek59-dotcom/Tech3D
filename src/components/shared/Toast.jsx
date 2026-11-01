export default function Toast({ message }) {
  return <div className={`toast glass${message ? ' show' : ''}`} role="status">{message}</div>;
}
