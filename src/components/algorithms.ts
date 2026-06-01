// src/components/algorithms.ts

export interface CourtCase {
  c_id: string;
  type_name: string;
  date_of_filing: string;
  section: string;
  female_petitioner: number;
  durationHours: number;
  startTime: number; // 9 to 17 (Court Hours)
  endTime: number;
  urgencyScore?: number;
}

// ==========================================
// 1. TRANSFORM AND CONQUER (Representation Change: Max-Heap)
// ==========================================
export class MaxHeap {
  heap: CourtCase[] = [];

  insert(val: CourtCase) {
    this.heap.push(val);
    this.bubbleUp(this.heap.length - 1);
  }

  bubbleUp(index: number) {
    while (index > 0) {
      let parentIdx = Math.floor((index - 1) / 2);
      if ((this.heap[index].urgencyScore || 0) <= (this.heap[parentIdx].urgencyScore || 0)) break;
      [this.heap[index], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[index]];
      index = parentIdx;
    }
  }

  extractMax(): CourtCase | null {
    if (this.heap.length === 0) return null;
    const max = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0 && end) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return max;
  }

  sinkDown(index: number) {
    let length = this.heap.length;
    let element = this.heap[index];
    let elemScore = element.urgencyScore || 0;

    while (true) {
      let leftChildIdx = 2 * index + 1;
      let rightChildIdx = 2 * index + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIdx < length) {
        leftChild = this.heap[leftChildIdx];
        if ((leftChild.urgencyScore || 0) > elemScore) swap = leftChildIdx;
      }

      if (rightChildIdx < length) {
        rightChild = this.heap[rightChildIdx];
        if (
          (swap === null && (rightChild.urgencyScore || 0) > elemScore) ||
          (swap !== null && (rightChild.urgencyScore || 0) > (this.heap[swap].urgencyScore || 0))
        ) {
          swap = rightChildIdx;
        }
      }

      if (swap === null) break;
      this.heap[index] = this.heap[swap];
      this.heap[swap] = element;
      index = swap;
    }
  }
}

// ==========================================
// 2. DECREASE AND CONQUER (Binary Search)
// ==========================================
export function binarySearchLatestNonConflicting(cases: CourtCase[], index: number): number {
  let low = 0;
  let high = index - 1;

  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    if (cases[mid].endTime <= cases[index].startTime) {
      if (cases[mid + 1].endTime <= cases[index].startTime) {
        low = mid + 1;
      } else {
        return mid;
      }
    } else {
      high = mid - 1;
    }
  }
  return -1;
}

// ==========================================
// 3. DYNAMIC PROGRAMMING (Weighted Interval Scheduling)
// ==========================================
export function optimizeDocketWithDP(cases: CourtCase[]): { optimalCases: CourtCase[], dpTable: number[], logTrace: string[] } {
  let logTrace: string[] = [];
  if (cases.length === 0) return { optimalCases: [], dpTable: [], logTrace };

  // Sort by end time first to establish proper DP sequence boundaries
  const sortedCases = [...cases].sort((a, b) => a.endTime - b.endTime);
  const n = sortedCases.length;
  const M: number[] = new Array(n).fill(0);
  
  M[0] = sortedCases[0].urgencyScore || 0;
  logTrace.push(`DP Base State M[0] initialized to initial urgency: ${M[0]}`);

  for (let i = 1; i < n; i++) {
    let currentWeight = sortedCases[i].urgencyScore || 0;
    // Call Decrease & Conquer binary search step
    let pIdx = binarySearchLatestNonConflicting(sortedCases, i);
    logTrace.push(`Case Index ${i} (${sortedCases[i].c_id}): Binary Search located index -> ${pIdx}`);

    if (pIdx !== -1) {
      currentWeight += M[pIdx];
    }
    M[i] = Math.max(currentWeight, M[i - 1]);
    logTrace.push(`DP State Update: M[${i}] calculated value = ${M[i]}`);
  }

  // Backtracking loop to recover the selected optimal subsets
  let optimalCases: CourtCase[] = [];
  let i = n - 1;
  while (i >= 0) {
    if (i === 0) {
      optimalCases.push(sortedCases[i]);
      break;
    }
    let currentWeight = sortedCases[i].urgencyScore || 0;
    let pIdx = binarySearchLatestNonConflicting(sortedCases, i);
    if (pIdx !== -1) currentWeight += M[pIdx];

    if (currentWeight >= M[i - 1]) {
      optimalCases.push(sortedCases[i]);
      i = pIdx;
    } else {
      i--;
    }
  }

  return { optimalCases: optimalCases.reverse(), dpTable: M, logTrace };
}

// ==========================================
// 4. GREEDY TECHNIQUE (Interval Partitioning / Room Allocation)
// ==========================================
export function allocateRoomsGreedy(cases: CourtCase[], maxRooms: number) {
  // Sort cases by earliest start time property
  const sorted = [...cases].sort((a, b) => a.startTime - b.startTime);
  const rooms: CourtCase[][] = Array.from({ length: maxRooms }, () => []);
  let allocationLogs: string[] = [];

  sorted.forEach((c) => {
    let assigned = false;
    for (let r = 0; r < maxRooms; r++) {
      // Greedy choice: Assign to the first open courtroom where the last hearing finishes before this one begins
      if (rooms[r].length === 0 || rooms[r][rooms[r].length - 1].endTime <= c.startTime) {
        rooms[r].push(c);
        allocationLogs.push(`Greedy Assignment: Appended Case ${c.c_id} directly onto Judge Room ${r + 1}`);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      allocationLogs.push(`Resource Conflict: Case ${c.c_id} dropped due to active Courtroom structural shortfalls.`);
    }
  });

  return { rooms, allocationLogs };
}