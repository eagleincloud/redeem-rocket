/**
 * A* search for optimal multi-stop routing.
 *
 * Problem: given an origin and N destination nodes, find the ordering that
 * minimises total straight-line (Haversine) travel distance — i.e. solve
 * TSP exactly for small N and fall back to greedy nearest-neighbour for N > 12.
 *
 * Heuristic used: MST lower-bound (admissible → A* is optimal).
 *   h(state) = MST of unvisited nodes  +  distance from current to nearest unvisited
 *
 * Complexity: O(N! / pruning) for exact search; O(N²) for greedy fallback.
 */

import { distanceKm } from './geo';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RouteNode {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}

interface AStarState {
  currentId: string;
  /** Ordered ids of businesses visited so far */
  visited: string[];
  /** Total Haversine distance (km) accumulated */
  gCost: number;
  /** Heuristic estimate of remaining distance */
  hCost: number;
  fCost: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nodeDist(a: RouteNode, b: RouteNode): number {
  return distanceKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng });
}

/**
 * Admissible heuristic: MST of unvisited nodes + min distance from current to any unvisited.
 * Computed with Prim's algorithm — O(N²).
 */
function mstHeuristic(
  currentId: string,
  unvisited: string[],
  nodeMap: Map<string, RouteNode>,
): number {
  if (unvisited.length === 0) return 0;

  const current = nodeMap.get(currentId)!;

  // Distance from current position to nearest unvisited
  let minToFirst = Infinity;
  for (const id of unvisited) {
    const d = nodeDist(current, nodeMap.get(id)!);
    if (d < minToFirst) minToFirst = d;
  }

  if (unvisited.length === 1) return minToFirst;

  // Prim's MST over unvisited set
  const inMST = new Set<string>();
  const key = new Map<string, number>(unvisited.map((id) => [id, Infinity]));
  key.set(unvisited[0], 0);

  let mstWeight = 0;
  while (inMST.size < unvisited.length) {
    // Pick min-key node not in MST
    let minKey = Infinity;
    let minId = '';
    for (const id of unvisited) {
      if (!inMST.has(id) && key.get(id)! < minKey) {
        minKey = key.get(id)!;
        minId = id;
      }
    }
    if (!minId) break;
    inMST.add(minId);
    mstWeight += minKey;

    const minNode = nodeMap.get(minId)!;
    for (const id of unvisited) {
      if (!inMST.has(id)) {
        const d = nodeDist(minNode, nodeMap.get(id)!);
        if (d < key.get(id)!) key.set(id, d);
      }
    }
  }

  return minToFirst + mstWeight;
}

// ─── Greedy nearest-neighbour fallback (O(N²)) ───────────────────────────────

export function greedyNearestNeighbour(
  origin: RouteNode,
  destinations: RouteNode[],
): RouteNode[] {
  const remaining = [...destinations];
  const result: RouteNode[] = [];
  let cur = origin;

  while (remaining.length > 0) {
    let bestDist = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < remaining.length; i++) {
      const d = nodeDist(cur, remaining[i]);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    const [nearest] = remaining.splice(bestIdx, 1);
    result.push(nearest);
    cur = nearest;
  }

  return result;
}

// ─── A* exact search (N ≤ 12) ────────────────────────────────────────────────

/**
 * Returns the destinations in the optimal visit order (shortest total Haversine tour).
 *
 * For N > 12 falls back to greedy nearest-neighbour automatically.
 */
export function astarOptimalRoute(
  origin: RouteNode,
  destinations: RouteNode[],
): RouteNode[] {
  if (destinations.length === 0) return [];
  if (destinations.length === 1) return [...destinations];
  if (destinations.length > 12) return greedyNearestNeighbour(origin, destinations);

  const nodeMap = new Map<string, RouteNode>();
  nodeMap.set(origin.id, origin);
  for (const d of destinations) nodeMap.set(d.id, d);

  const destIds = destinations.map((d) => d.id);

  // Simple binary-string visited-set encoded as integer for fast dedup
  const idxMap = new Map<string, number>(destIds.map((id, i) => [id, i]));
  const N = destIds.length;

  // State key = currentIndex (4 bits) + visitedMask (N bits)
  const seen = new Set<string>();

  // Open list — sorted by fCost (small N so plain array + sort is fine)
  const open: AStarState[] = [];
  const h0 = mstHeuristic(origin.id, destIds, nodeMap);
  open.push({ currentId: origin.id, visited: [], gCost: 0, hCost: h0, fCost: h0 });

  let best: AStarState | null = null;

  while (open.length > 0) {
    open.sort((a, b) => a.fCost - b.fCost);
    const state = open.shift()!;

    // Deduplication key: currentId + sorted visited mask
    const mask = state.visited.reduce((acc, id) => acc | (1 << idxMap.get(id)!), 0);
    const stateKey = `${state.currentId}:${mask}`;
    if (seen.has(stateKey)) continue;
    seen.add(stateKey);

    if (state.visited.length === N) {
      best = state;
      break; // A* with admissible heuristic → first complete state is optimal
    }

    const visitedSet = new Set(state.visited);
    const unvisited = destIds.filter((id) => !visitedSet.has(id));
    const cur = nodeMap.get(state.currentId)!;

    for (const nextId of unvisited) {
      const next = nodeMap.get(nextId)!;
      const gNew = state.gCost + nodeDist(cur, next);
      const newVisited = [...state.visited, nextId];
      const remaining = unvisited.filter((id) => id !== nextId);
      const hNew = mstHeuristic(nextId, remaining, nodeMap);

      open.push({
        currentId: nextId,
        visited: newVisited,
        gCost: gNew,
        hCost: hNew,
        fCost: gNew + hNew,
      });
    }

    // Safety valve: cap explored states to avoid jank on slow devices
    if (seen.size > 100_000) break;
  }

  // Map back to RouteNode[]
  if (best) {
    const ordered = best.visited.map((id) => nodeMap.get(id)!).filter(Boolean);
    // Append any not visited (safety, shouldn't happen)
    const visitedSet = new Set(best.visited);
    for (const d of destinations) if (!visitedSet.has(d.id)) ordered.push(d);
    return ordered;
  }

  // Fallback if A* was cut off
  return greedyNearestNeighbour(origin, destinations);
}

/**
 * Total Haversine tour distance in km: origin → ordered stops.
 */
export function tourDistanceKm(origin: RouteNode, ordered: RouteNode[]): number {
  let total = 0;
  let prev = origin;
  for (const node of ordered) {
    total += nodeDist(prev, node);
    prev = node;
  }
  return total;
}
