function RoleButton({ label, variant = 'primary', onClick, isActive = false }) {
  const baseClassName =
    variant === 'secondary' ? 'secondary-button' : 'primary-button'
  const className = isActive ? `${baseClassName} active` : baseClassName

  return (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  )
}

export default RoleButton
