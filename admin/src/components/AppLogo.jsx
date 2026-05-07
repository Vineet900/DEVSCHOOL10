export default function AppLogo({ size = 28, className = '' }) {
  return (
    <img
      src="/devschool-icon.svg"
      alt="DevSchool Pro logo"
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
    />
  )
}
