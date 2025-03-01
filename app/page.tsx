import { Button } from "@/components/ui/button"
import { CheckCircle, Circle } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-black text-white">
      <div className="w-full max-w-5xl flex flex-col items-center justify-center min-h-screen p-6 md:p-24">
        {/* Hero Section */}
        <div className="w-full flex flex-col items-center text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            LockIn
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-8">
            Stay focused. Get things done.
          </p>

          <div className="relative w-full max-w-md mx-auto my-12">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-2xl">
              <h2 className="text-xl font-medium mb-4">Your Action Items</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="text-gray-400 line-through">Task a</span>
                  </div>
                  <span className="text-gray-500">1</span>
                </div>

                <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <Circle className="h-5 w-5 text-gray-500" />
                    <span>task b</span>
                  </div>
                  <span className="text-gray-500">2</span>
                </div>

                <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <Circle className="h-5 w-5 text-gray-500" />
                    <span>task c</span>
                  </div>
                  <span className="text-gray-500">3</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4 bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 text-gray-300"
              >
                Edit List
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <Button className="px-8 py-6 text-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:shadow-emerald-500/30">
              Coming Soon
            </Button>
            <p className="mt-4 text-gray-500">Be the first to know when we launch</p>

            <div className="mt-8 flex gap-4">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-64"
                />
              </div>
              <Button variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                Notify Me
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-medium mb-2 text-emerald-400">Stay Focused</h3>
            <p className="text-gray-400">
              LockIn helps you maintain focus on what matters most with intelligent task prioritization.
            </p>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-medium mb-2 text-emerald-400">Smart Reminders</h3>
            <p className="text-gray-400">
              Get gentle nudges when you stray off course, keeping you accountable to your goals.
            </p>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-medium mb-2 text-emerald-400">Minimalist Design</h3>
            <p className="text-gray-400">
              A clean, distraction-free interface that helps you focus on completing tasks, not managing them.
            </p>
          </div>
        </div>

        <footer className="w-full mt-16 text-center text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} LockIn. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}

