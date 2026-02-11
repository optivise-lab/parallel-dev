import { X } from 'lucide-react'

interface AboutProps {
  onClose: () => void
}

export function About({ onClose }: AboutProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-lg w-[600px] max-h-[80vh] shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">About ParallelDev</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto text-sm text-text-secondary leading-relaxed">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="ParallelDev" className="h-10" />
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text-primary">Building the Future of AI-Native Development</h3>
            <p>ParallelDev was created with a simple belief:</p>
            <p className="text-text-primary font-medium italic">
              Modern developers shouldn't be limited by AI session constraints.
            </p>
            <p>
              As AI coding agents become more powerful, workflows are becoming more complex.
              Developers want to experiment, branch, test ideas, and ship features in parallel
              — without breaking context or juggling terminals.
            </p>
            <p>ParallelDev enables exactly that.</p>
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-start gap-2"><span className="text-accent-green mt-0.5">•</span>Run multiple AI coding agents simultaneously.</li>
              <li className="flex items-start gap-2"><span className="text-accent-green mt-0.5">•</span>Isolate work by branch.</li>
              <li className="flex items-start gap-2"><span className="text-accent-green mt-0.5">•</span>Stay fully native to your terminal.</li>
              <li className="flex items-start gap-2"><span className="text-accent-green mt-0.5">•</span>Maintain complete control.</li>
            </ul>
            <p>No wrappers. No vendor lock-in. No hidden orchestration.</p>
            <p className="text-text-primary font-medium">Just Git + Terminal + AI — working the way developers expect.</p>
          </div>

          <div className="border-t border-border pt-5 space-y-3">
            <h3 className="text-base font-semibold text-text-primary">Our Mission</h3>
            <p>
              To empower developers with a clean, native environment for parallel AI-driven
              development — without abstraction layers or ecosystem constraints.
            </p>
          </div>

          <div className="border-t border-border pt-5 space-y-3">
            <h3 className="text-base font-semibold text-text-primary">Developed by Optiviselab</h3>
            <p>
              ParallelDev is proudly developed by <span className="text-text-primary font-medium">Optiviselab</span> — a
              product-focused innovation studio dedicated to building practical tools for modern engineers.
            </p>
            <p>We focus on:</p>
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-start gap-2"><span className="text-accent-blue mt-0.5">•</span>Developer-first systems</li>
              <li className="flex items-start gap-2"><span className="text-accent-blue mt-0.5">•</span>Infrastructure simplicity</li>
              <li className="flex items-start gap-2"><span className="text-accent-blue mt-0.5">•</span>Performance and control</li>
              <li className="flex items-start gap-2"><span className="text-accent-blue mt-0.5">•</span>Future-ready workflows</li>
            </ul>
            <div className="space-y-2 pt-2">
              <p>
                <span className="text-text-muted mr-2">🌐</span>
                <a
                  href="https://paralleldev.optiviselab.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline"
                >
                  paralleldev.optiviselab.com
                </a>
              </p>
              <p>
                <span className="text-text-muted mr-2">🐦</span>
                <a
                  href="https://x.com/ALEMRANCU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline"
                >
                  @ALEMRANCU
                </a>
              </p>
            </div>
            <p className="pt-2">Optiviselab builds tools that respect how engineers actually work.</p>
            <p>
              ParallelDev is our step toward shaping the next generation of AI-native development environments.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
