import { useNavigate }  from 'react-router-dom';
import { MapPin, List, Map as MapIcon } from 'lucide-react';
import { useSearchCategory } from '../context/SearchCategoryContext';

export function ScrapedBusinessesPage() {
  const navigate = useNavigate();
  const { locationScrapedBusinesses, businessesLoading } = useSearchCategory();

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-slate-50 to-white pb-24">
      <div className="p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scraped Businesses</h1>
          <p className="text-gray-500 text-sm">
            From scraped_businesses table · within 5 km of your location
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-medium shadow hover:bg-slate-800"
        >
          <MapIcon size={18} />
          View on map
        </button>
      </div>

      {businessesLoading ? (
        <div className="px-4 py-12 text-center text-gray-500">Loading scraped businesses…</div>
      ) : locationScrapedBusinesses.length === 0 ? (
        <div className="px-4 py-12 text-center text-gray-500">
          <p className="font-medium">No scraped businesses in your area</p>
          <p className="text-sm mt-1">Move or set a different location to see more.</p>
        </div>
      ) : (
        <>
          <div className="px-4 py-2 flex items-center gap-2 text-sm text-gray-600">
            <List size={18} />
            <span>{locationScrapedBusinesses.length} businesses</span>
          </div>
          <div className="px-4 pb-6 space-y-3">
            {locationScrapedBusinesses.map((business) => (
              <div
                key={business.id}
                className="bg-white rounded-xl p-4 shadow border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-lg shrink-0">
                    {business.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{business.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{business.address}</p>
                    {typeof (business as { distance?: number }).distance === 'number' && (
                      <p className="text-xs text-slate-600 mt-1">
                        {(business as { distance?: number }).distance?.toFixed(1)} km away
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/', { state: { selectedBusinessId: business.id, isScraped: true } })
                    }
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 shrink-0"
                  >
                    <MapPin size={14} />
                    Map
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
