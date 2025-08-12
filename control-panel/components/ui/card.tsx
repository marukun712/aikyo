export default function Card({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="no-padding s6">
      <div className="padding">
        <h5>{title}</h5>
        <p>{description}</p>
      </div>
    </article>
  );
}
