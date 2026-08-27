import Row from './Row.jsx';

/* Renders items under their group headings. `grouped` is preserved for the
 * Unicode and Google tabs; favorites render as one flat, newest-first list. */
export default function ResultList({ items, emptyMessage, grouped = true, rowProps }) {
  if (!items.length) return <p className="empty">{emptyMessage}</p>;

  if (!grouped) {
    return items.map((item) => (
      <Row key={item.id} item={item} {...rowProps(item)} />
    ));
  }

  const groups = [];
  const byGroup = Object.create(null);
  items.forEach((item) => {
    if (!byGroup[item.group]) {
      byGroup[item.group] = [];
      groups.push(item.group);
    }
    byGroup[item.group].push(item);
  });

  return groups.map((group) => (
    <div key={group}>
      <div className="group-heading">{group} · {byGroup[group].length}</div>
      {byGroup[group].map((item) => (
        <Row key={item.id} item={item} {...rowProps(item)} />
      ))}
    </div>
  ));
}
