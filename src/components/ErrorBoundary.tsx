import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Catches render-time errors so a crash in one page doesn't blank the whole app. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No external reporting (privacy): log locally only.
    console.error('App error:', error, info.componentStack)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-bd-green-50 via-white to-bd-green-50/50 p-6">
          <div className="max-w-md w-full glass-card p-8 text-center shadow-soft-lg">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bd-red-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-bd-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-heading font-bold text-bd-red-700">কিছু একটা ভুল হয়েছে</h1>
            <p className="text-sm text-gray-600 mt-3 font-medium">
              পৃষ্ঠাটি লোড করা যায়নি। পুনরায় চেষ্টা করুন।
            </p>
            <button
              onClick={this.handleReload}
              className="btn-primary mt-6"
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
