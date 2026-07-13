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
        <div className="min-h-full flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white rounded-xl border border-red-200 p-6 text-center">
            <h1 className="text-lg font-bold text-red-700">কিছু একটা ভুল হয়েছে</h1>
            <p className="text-sm text-gray-600 mt-2">
              পৃষ্ঠাটি লোড করা যায়নি। পুনরায় চেষ্টা করুন।
            </p>
            <button
              onClick={this.handleReload}
              className="mt-4 rounded-lg bg-maroon text-white px-4 py-2 text-sm font-semibold"
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
