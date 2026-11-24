import { Link } from 'react-router-dom';

interface Props {
  title: string;
  milestone?: string;
}

export function Placeholder({ title, milestone }: Props) {
  return (
    <main className="mx-auto max-w-page px-4 py-12">
      <h1 className="text-3xl">{title}</h1>
      {milestone && (
        <p className="mt-4 text-muted">This screen arrives in milestone {milestone}.</p>
      )}
      <p className="mt-8">
        <Link to="/" className="text-green-700 underline">
          Back to home
        </Link>
      </p>
    </main>
  );
}
