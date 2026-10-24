import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="card stack">
      <p className="eyebrow">Missing page</p>
      <h1>That link does not open a tip jar.</h1>
      <Link className="button" to="/">
        Back to the start
      </Link>
    </main>
  )
}
