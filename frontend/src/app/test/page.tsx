export default function TestPage() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary-600 mb-4">
              🎉 Styling Test Page
            </h1>
            <p className="text-lg text-gray-600">
              If you can see this properly styled, your Tailwind is working!
            </p>
          </div>
  
          {/* Button Tests */}
          <div className="card p-6">
            <h2 className="text-2xl font-semibold mb-4">Button Components</h2>
            <div className="flex flex-wrap gap-4">
              <button className="btn btn-primary">Primary Button</button>
              <button className="btn btn-secondary">Secondary Button</button>
              <button className="btn btn-outline">Outline Button</button>
              <button className="btn btn-ghost">Ghost Button</button>
            </div>
          </div>
  
          {/* Card Tests */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-primary-600 mb-2">Card 1</h3>
              <p className="text-gray-600">This is a test card with proper styling.</p>
              <div className="mt-4">
                <span className="badge badge-success">Active</span>
              </div>
            </div>
            
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-warning-600 mb-2">Card 2</h3>
              <p className="text-gray-600">Another test card with hover effects.</p>
              <div className="mt-4">
                <span className="badge badge-warning">Pending</span>
              </div>
            </div>
            
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-danger-600 mb-2">Card 3</h3>
              <p className="text-gray-600">Third test card to verify grid layout.</p>
              <div className="mt-4">
                <span className="badge badge-danger">Error</span>
              </div>
            </div>
          </div>
  
          {/* Form Tests */}
          <div className="card p-6">
            <h2 className="text-2xl font-semibold mb-4">Form Components</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Input
                </label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Enter some text..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Dropdown
                </label>
                <select className="input">
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
            </div>
          </div>
  
          {/* Status Badge Tests */}
          <div className="card p-6">
            <h2 className="text-2xl font-semibold mb-4">Case Status Badges</h2>
            <div className="flex flex-wrap gap-4">
              <span className="status-filed">Filed</span>
              <span className="status-under-review">Under Review</span>
              <span className="status-judged">Judged</span>
              <span className="status-settled">Settled</span>
              <span className="status-dismissed">Dismissed</span>
              <span className="status-appealed">Appealed</span>
            </div>
          </div>
  
          {/* Animation Test */}
          <div className="card p-6">
            <h2 className="text-2xl font-semibold mb-4">Animation Test</h2>
            <div className="animate-fade-in">
              <p className="text-gray-600">This should fade in smoothly.</p>
            </div>
            <div className="mt-4">
              <div className="w-8 h-8 bg-primary-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }