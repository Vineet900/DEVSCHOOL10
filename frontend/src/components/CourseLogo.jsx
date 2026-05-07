const LOGO_BY_COURSE = {
  html: '/html-logo.svg',
  css: '/css-logo.svg',
  javascript: '/javascript-logo.svg',
}

export default function CourseLogo({ courseId, size = 22 }) {
  const src = LOGO_BY_COURSE[courseId]
  if (!src) return null

  return (
    <img
      src={src}
      alt={`${courseId} logo`}
      width={size}
      height={size}
      className="rounded-md"
    />
  )
}
