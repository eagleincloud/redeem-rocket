export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Redeem Rocket 🚀
          </h1>
          <p className="text-xl text-gray-600">
            Find amazing deals and offers from local businesses near you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Find Deals</h3>
            <p className="text-gray-600">Discover exclusive offers from verified businesses</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2">Save More</h3>
            <p className="text-gray-600">Get the best discounts on your favorite services</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-lg font-semibold mb-2">Near You</h3>
            <p className="text-gray-600">Find businesses within your preferred service radius</p>
          </div>
        </div>

        <div className="bg-blue-600 text-white p-8 rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to save?</h2>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
            Explore Deals
          </button>
        </div>
      </div>
    </div>
  )
}
