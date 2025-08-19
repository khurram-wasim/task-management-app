import { ReactNode } from 'react'
import { Header } from './Header'

interface LayoutProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl' | 'full'
  padding?: boolean
  background?: 'white' | 'gray' | 'blue'
}

export function Layout({ 
  children, 
  className = '', 
  maxWidth = '7xl', 
  padding = true, 
  background = 'gray' 
}: LayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    blue: 'bg-blue-50'
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className={`${backgroundClasses[background]} ${className}`}>
        <div className={`${maxWidthClasses[maxWidth]} mx-auto ${padding ? 'px-4 sm:px-6 lg:px-8 py-6' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  )
}

// Specialized layout variants
interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-gray-600">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  )
}

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  actions?: ReactNode
  sidebar?: ReactNode
}

export function DashboardLayout({ 
  children, 
  title, 
  subtitle, 
  actions, 
  sidebar 
}: DashboardLayoutProps) {
  return (
    <Layout background="gray">
      <div className="space-y-6">
        {/* Page header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-gray-600">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-3">
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Main content with optional sidebar */}
        <div className={`${sidebar ? 'lg:grid lg:grid-cols-12 lg:gap-6' : ''}`}>
          {sidebar && (
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {sidebar}
              </div>
            </div>
          )}
          
          <div className={`${sidebar ? 'lg:col-span-9' : ''}`}>
            {children}
          </div>
        </div>
      </div>
    </Layout>
  )
}

interface BoardLayoutProps {
  children: ReactNode
  boardTitle: string
  boardDescription?: string
  actions?: ReactNode
}

export function BoardLayout({ 
  children, 
  boardTitle, 
  boardDescription, 
  actions 
}: BoardLayoutProps) {
  return (
    <Layout background="blue" maxWidth="full" padding={false}>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Board header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 px-6 py-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{boardTitle}</h1>
              {boardDescription && (
                <p className="mt-1 text-sm text-gray-600">{boardDescription}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-3">
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Board content */}
        <div className="pb-6">
          {children}
        </div>
      </div>
    </Layout>
  )
}