const queues = [
  {title:'Source changes', count:'0', detail:'Hash changes awaiting materiality review.'},
  {title:'Rule review', count:'0', detail:'Normalized rules awaiting human verification.'},
  {title:'Source health', count:'1', detail:'GOV.UK adapter registered in the MVP.'},
];
export default function Page(){return <main className="shell"><p className="pill">INTERNAL</p><h1>Culture Context Admin</h1><p className="muted">The operational surface for provenance, source health, change review, and country coverage. This scaffold intentionally does not fabricate queue data.</p><section className="grid">{queues.map(q=><article className="card" key={q.title}><div className="muted">{q.title}</div><h2>{q.count}</h2><p>{q.detail}</p></article>)}</section><section className="card" style={{marginTop:14}}><h2>Next admin milestone</h2><p>Persist source snapshots, compute diffs, require a human decision for material legal changes, and publish only reviewed normalized records.</p></section></main>}
