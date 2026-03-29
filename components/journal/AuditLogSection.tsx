interface Props {
  postDates: { createdAt: string; updatedAt: string } | null
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AuditLogSection({ postDates }: Props) {
  if (!postDates) return null

  const wasEdited = postDates.updatedAt !== postDates.createdAt

  return (
    <section id="audit-log" className="journal-section">
      <h2 className="journal-section-title">Audit Log</h2>
      <table className="audit-table">
        <tbody>
          <tr>
            <td className="audit-event">Post created</td>
            <td className="audit-date">{formatDateTime(postDates.createdAt)}</td>
          </tr>
          {wasEdited && (
            <tr>
              <td className="audit-event">Last edited</td>
              <td className="audit-date">{formatDateTime(postDates.updatedAt)}</td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="audit-note">A comments feed will appear here in a future release.</p>
    </section>
  )
}
