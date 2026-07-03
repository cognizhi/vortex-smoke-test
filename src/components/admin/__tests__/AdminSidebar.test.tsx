import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import AdminSidebar from '../AdminSidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

// Mock auth context
vi.mock('@/lib/auth-context', () => ({
  useAuth: vi.fn(),
}))

describe('AdminSidebar', () => {
  const mockPush = vi.fn()
  const mockRouter = { push: mockPush }
  const mockUser = {
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    slug: 'jane-shop',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
    vi.mocked(usePathname).mockReturnValue('/admin')
    vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders sidebar with brand information', () => {
    render(<AdminSidebar slug="test-merchant" />)

    expect(screen.getByText('SimplyBook')).toBeInTheDocument()
    expect(screen.getByText('test-merchant')).toBeInTheDocument()
  })

  it('renders all navigation items', () => {
    render(<AdminSidebar slug="test-merchant" />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Staff')).toBeInTheDocument()
    expect(screen.getByText('Services')).toBeInTheDocument()
    expect(screen.getByText('Customers')).toBeInTheDocument()
    expect(screen.getByText('Design')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('highlights active navigation item', () => {
    vi.mocked(usePathname).mockReturnValue('/admin/staff')
    render(<AdminSidebar slug="test-merchant" />)

    const staffLink = screen.getByText('Staff').closest('a')
    expect(staffLink).toHaveClass('bg-indigo-50', 'text-indigo-700')
  })

  it('renders booking page link with merchant slug', () => {
    render(<AdminSidebar slug="acme-salon" />)

    const bookingLink = screen.getByText('Booking page')
    expect(bookingLink).toHaveAttribute('href', 'https://acme-salon.platform.com')
  })

  it('does NOT render logout button in sidebar (logout is in avatar dropdown)', () => {
    render(<AdminSidebar slug="test-merchant" />)

    // The old "Sign out" button should be removed from the sidebar
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument()
  })

  it('renders avatar with user information', () => {
    render(<AdminSidebar slug="test-merchant" />)

    // Avatar button should be present
    const avatarButton = screen.getByRole('button', { name: /jane smith profile menu/i })
    expect(avatarButton).toBeInTheDocument()
  })

  it('opens profile dropdown when avatar is clicked', async () => {
    render(<AdminSidebar slug="test-merchant" />)

    const avatarButton = screen.getByRole('button', { name: /jane smith profile menu/i })
    fireEvent.click(avatarButton)

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /edit profile/i })).toBeInTheDocument()
    })
  })

  it('shows logout button in avatar dropdown', async () => {
    render(<AdminSidebar slug="test-merchant" />)

    const avatarButton = screen.getByRole('button', { name: /jane smith profile menu/i })
    fireEvent.click(avatarButton)

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument()
    })
  })

  it('calls logout API when log out button is clicked', async () => {
    render(<AdminSidebar slug="test-merchant" />)

    const avatarButton = screen.getByRole('button', { name: /jane smith profile menu/i })
    fireEvent.click(avatarButton)

    const logoutButton = screen.getByRole('menuitem', { name: /log out/i })
    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('renders theme toggle button', () => {
    render(<AdminSidebar slug="test-merchant" />)

    const themeButton = screen.getByRole('button', { name: /theme options/i })
    expect(themeButton).toBeInTheDocument()
  })

  it('correctly determines active state for dashboard', () => {
    vi.mocked(usePathname).mockReturnValue('/admin')
    render(<AdminSidebar slug="test-merchant" />)

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveClass('bg-indigo-50', 'text-indigo-700')
  })

  it('correctly determines active state for nested paths', () => {
    vi.mocked(usePathname).mockReturnValue('/admin/staff/123/availability')
    render(<AdminSidebar slug="test-merchant" />)

    const staffLink = screen.getByText('Staff').closest('a')
    expect(staffLink).toHaveClass('bg-indigo-50', 'text-indigo-700')
  })

  it('positions avatar at bottom of sidebar', () => {
    const { container } = render(<AdminSidebar slug="test-merchant" />)

    const sidebar = container.querySelector('aside')
    expect(sidebar).toHaveClass('flex', 'flex-col')

    // Get all child elements
    const children = sidebar?.children
    if (children) {
      // Avatar should be in the last child
      const lastChild = children[children.length - 1]
      expect(lastChild).toHaveClass('flex', 'items-center', 'gap-3')

      // Verify avatar button is in the last section
      const avatarButton = lastChild.querySelector('button[aria-haspopup="menu"]')
      expect(avatarButton).toBeInTheDocument()
    }
  })

  it('maintains correct sidebar structure: Brand → Nav → Actions → Avatar', () => {
    const { container } = render(<AdminSidebar slug="test-merchant" />)

    const sidebar = container.querySelector('aside')
    const children = Array.from(sidebar?.children || [])

    // Verify structure: first should have brand info
    expect(children[0]).toHaveTextContent('SimplyBook')

    // Second should be navigation (has flex-1)
    expect(children[1]).toHaveClass('flex-1')

    // Third should have bottom actions (Booking page link)
    expect(children[2]).toHaveTextContent('Booking page')

    // Fourth (last) should have avatar and theme toggle
    const lastChild = children[children.length - 1]
    const avatarButton = lastChild.querySelector('button[aria-haspopup="menu"]')
    expect(avatarButton).toBeInTheDocument()
  })

  it('avatar section has top border divider at bottom position', () => {
    const { container } = render(<AdminSidebar slug="test-merchant" />)

    const sidebar = container.querySelector('aside')
    const avatarSection = sidebar?.children[sidebar.children.length - 1]

    // Avatar section should have border-t (not border-b)
    expect(avatarSection).toHaveClass('border-t', 'border-slate-100')
  })

  it('sidebar maintains proper spacing at bottom with avatar', () => {
    const { container } = render(<AdminSidebar slug="test-merchant" />)

    const sidebar = container.querySelector('aside')
    expect(sidebar).toHaveClass('h-full')

    // Verify avatar section has proper padding
    const avatarSection = sidebar?.children[sidebar.children.length - 1]
    expect(avatarSection).toHaveClass('px-5', 'py-3')
  })

  it('avatar remains interactive when positioned at bottom', async () => {
    render(<AdminSidebar slug="test-merchant" />)

    const avatarButton = screen.getByRole('button', { name: /jane smith profile menu/i })

    // Avatar should be clickable
    expect(avatarButton).toBeEnabled()

    // Click avatar to open dropdown
    fireEvent.click(avatarButton)

    await waitFor(() => {
      // Dropdown should appear with user info
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('theme toggle remains accessible at bottom with avatar', () => {
    render(<AdminSidebar slug="test-merchant" />)

    const themeButton = screen.getByRole('button', { name: /theme options/i })
    expect(themeButton).toBeInTheDocument()
    expect(themeButton).toBeEnabled()
  })

  // Additional tests for BKNG-0046: SimplyBook brand title update

  it('displays SimplyBook as the brand title', () => {
    render(<AdminSidebar slug="test-merchant" />)

    const brandTitle = screen.getByText('SimplyBook')
    expect(brandTitle).toBeInTheDocument()
    expect(brandTitle).toHaveClass('text-sm', 'font-semibold', 'text-slate-900', 'truncate')
  })

  it('does not display Booking text anymore', () => {
    render(<AdminSidebar slug="test-merchant" />)

    // "Booking" should NOT appear as brand title (but "Booking page" link may exist)
    // Get all elements with text Booking
    const bookingElements = screen.queryAllByText('Booking')

    // Filter to find if any is the brand title (has text-sm font-semibold classes)
    const brandBookingElement = bookingElements.find(el =>
      el.className.includes('text-sm') && el.className.includes('font-semibold')
    )

    expect(brandBookingElement).not.toBeInTheDocument()
  })

  it('brand title has proper text overflow handling', () => {
    const { container } = render(<AdminSidebar slug="test-merchant" />)

    const brandTitle = container.querySelector('.text-sm.font-semibold.text-slate-900')
    expect(brandTitle).toHaveClass('truncate')
    expect(brandTitle).toHaveTextContent('SimplyBook')
  })

  it('merchant slug displays correctly with brand title', () => {
    render(<AdminSidebar slug="acme-beauty" />)

    expect(screen.getByText('SimplyBook')).toBeInTheDocument()
    expect(screen.getByText('acme-beauty')).toBeInTheDocument()

    // Verify they are in the brand section together
    const slug = screen.getByText('acme-beauty')
    const brandSection = slug.closest('div.min-w-0')
    expect(brandSection).toHaveTextContent('SimplyBook')
  })

  it('brand section maintains correct structure with SimplyBook', () => {
    const { container } = render(<AdminSidebar slug="test-merchant" />)

    const brandSection = container.querySelector('div.border-b.border-slate-100')
    expect(brandSection).toBeInTheDocument()

    // Should contain logo
    const logo = brandSection?.querySelector('.bg-indigo-600')
    expect(logo).toBeInTheDocument()

    // Should contain SimplyBook text
    const brandTitle = brandSection?.querySelector('.text-sm.font-semibold')
    expect(brandTitle).toHaveTextContent('SimplyBook')

    // Should contain slug
    const slug = brandSection?.querySelector('.font-mono')
    expect(slug).toHaveTextContent('test-merchant')
  })
})
