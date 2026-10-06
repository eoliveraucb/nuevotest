export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}) {
  return (
    <div className={`section-heading section-heading-${align}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="section-title">{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}
