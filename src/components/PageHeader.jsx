import React from 'react'

/**
 * PageHeader Component
 * 
 * A consistent, reusable header component for all pages.
 * Provides standardized typography, iconography, and spacing.
 * 
 * @param {Object} props
 * @param {string} props.title - The page title
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {string} props.subtitle - Optional subtitle/description
 * @param {React.ReactNode} props.actions - Optional action buttons to display on the right
 * @param {string} props.iconColor - CSS color variable or hex code for the icon
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Additional content below subtitle
 */
export function PageHeader({
  title,
  icon: Icon,
  subtitle,
  actions,
  iconColor,
  className = '',
  children,
}) {
  // Default to accent color if no icon color specified
  const finalIconColor = iconColor || 'var(--color-accent)'

  return (
    <header className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 ${className}`}>
      {/* Left side: Title and subtitle */}
      <div className="flex-1">
        {/* Title with optional icon */}
        <h1
          className="text-3xl md:text-[var(--page-title-size)] font-bold text-[var(--page-title-color)] mb-2 flex items-center gap-3 leading-[var(--page-title-line-height)]"
          style={{
            fontSize: 'var(--page-title-size)',
            fontWeight: 'var(--page-title-weight)',
            color: 'var(--page-title-color)',
          }}
        >
          {Icon && (
            <Icon
              className="transition-transform duration-200 hover:scale-110"
              size={32}
              style={{ color: finalIconColor }}
            />
          )}
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p
            className="text-[var(--subtitle-size)] leading-relaxed"
            style={{
              fontWeight: 'var(--subtitle-weight)',
              color: 'var(--subtitle-color)',
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Additional content below subtitle */}
        {children}
      </div>

      {/* Right side: Action buttons */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}

/**
 * PageHeaderWithGlow
 * 
 * Enhanced version with subtle glow effect on hover
 * 
 * @param {Object} props - Same props as PageHeader
 */
export function PageHeaderWithGlow(props) {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${props.iconColor || 'var(--color-accent)'}15, transparent 70%)`,
        }}
      />
      <PageHeader {...props} className="relative" />
    </div>
  )
}

/**
 * PageHeaderCompact
 * 
 * Smaller, more compact version for cards or modals
 */
export function PageHeaderCompact({ title, icon: Icon, subtitle }) {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        {Icon && (
          <Icon size={20} style={{ color: 'var(--color-accent)' }} />
        )}
        <h2 className="text-xl font-bold text-[var(--page-title-color)]">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p
          className="text-sm"
          style={{ color: 'var(--subtitle-color)' }}
        >
          {subtitle}
        </p>
      )}
    </header>
  )
}

/**
 * PageHeaderBottom
 * 
 * Bottom-positioned header component that sits at the bottom-left of the page.
 * Uses glass effects and respects the template layering system.
 * Positioned above background layers but below content to avoid obstruction.
 * 
 * @param {Object} props
 * @param {string} props.title - The page title
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {string} props.subtitle - Optional subtitle/description
 * @param {React.ReactNode} props.actions - Optional action buttons to display on the right
 * @param {string} props.iconColor - CSS color variable or hex code for the icon
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Additional content below subtitle
 */
export function PageHeaderBottom({
  title,
  icon: Icon,
  subtitle,
  actions,
  iconColor,
  className = '',
  children,
}) {
  // Default to accent color if no icon color specified
  const finalIconColor = iconColor || 'var(--color-accent)'

  return (
    <div 
      className={`fixed bottom-6 z-[5] glass-card px-6 py-4 rounded-xl max-w-md transition-all duration-300 ${className}`}
      style={{ left: `calc(var(--sidebar-width, 0px) + 1.5rem)` }}
    >
      {/* Left side: Title and subtitle */}
      <div className="flex-1">
        {/* Title with optional icon */}
        <h2
          className="text-xl font-bold text-[var(--page-title-color)] mb-1 flex items-center gap-2"
          style={{
            fontSize: 'var(--page-title-size)',
            fontWeight: 'var(--page-title-weight)',
            color: 'var(--page-title-color)',
          }}
        >
          {Icon && (
            <Icon
              className="transition-transform duration-200 hover:scale-110"
              size={24}
              style={{ color: finalIconColor }}
            />
          )}
          {title}
        </h2>

        {/* Subtitle - smaller and more subtle */}
        {subtitle && (
          <p
            className="text-sm leading-relaxed line-clamp-2"
            style={{
              fontWeight: 'var(--subtitle-weight)',
              color: 'var(--subtitle-color)',
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Additional content below subtitle */}
        {children}
      </div>

      {/* Right side: Action buttons */}
      {actions && (
        <div className="flex items-center gap-2 mt-3">
          {actions}
        </div>
      )}
    </div>
  )
}
