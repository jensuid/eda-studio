export function CleaningStaleBanner({ message }: { message: string }) {
  return (
    <p role="status" className="cleaning-stale">{message}</p>
  );
}
