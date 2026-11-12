export function PageHeader({ eyebrow, title, description, actions, aside = null }) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        {eyebrow ? (
          <span className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            {eyebrow}
          </span>
        ) : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions || aside ? <div className="page-header-actions">{actions}{aside}</div> : null}
    </header>
  );
}
