/**
 * Ensure L is on window before leaflet.markercluster and leaflet-routing-machine load.
 * Import this first in any component that uses those plugins.
 */
import L from 'leaflet';
if (typeof window !== 'undefined') {
  (window as unknown as { L: typeof L }).L = L;
  (window as unknown as { Leaflet: typeof L }).Leaflet = L;
}
export default L;
