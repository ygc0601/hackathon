function BrandMark({ light = false, compact = false }) {
  const className = [
    'brand-mark',
    light ? 'brand-mark-light' : '',
    compact ? 'brand-mark-compact' : '',
  ].filter(Boolean).join(' ')

  return (
    <span className={className}>
      <span className="brand-icon" aria-hidden="true">
        <span className="brand-page">
          <i />
          <i />
          <i />
        </span>
        <span className="brand-speech" />
      </span>
      <span className="brand-name">같이읽기</span>
    </span>
  )
}

export default BrandMark
