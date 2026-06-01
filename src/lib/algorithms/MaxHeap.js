export class CaseMaxHeap {
  constructor() {
    self.heap = [];
  }

  // 1. Heuristic Priority Scoring Function
  calculatePriority(caseItem) {
    let score = 0;
    const details = caseItem.acts_sections?.[0] || {};

    // Criminal cases get massive weight multipliers
    if (details.criminal === '1' || details.criminal === 1) score += 500;
    
    // Non-bailable components amplify urgency
    if (details.bailable_ipc === '0' || details.bailable_ipc === 0) score += 300;

    // Accumulate points based on complexity scale
    const sectionCount = parseInt(details.number_sections_ipc) || 0;
    score += sectionCount * 25;

    // Time-delinquency compounding: calculate days elapsed since filing date
    if (caseItem.date_of_filing) {
      const filingDate = new Date(caseItem.date_of_filing);
      const today = new Date();
      const diffTime = Math.abs(today - filingDate);
      const daysPending = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      score += Math.min(daysPending * 0.1, 1000); // Caps time-weight accumulation
    }

    return Math.round(score);
  }

  // 2. Insert into the Heap: O(log n) complexity
  insert(caseItem) {
    const priority = self.calculatePriority(caseItem);
    const heapNode = { ...caseItem, priorityScore: priority };
    
    self.heap.push(heapNode);
    self.heapifyUp(self.heap.length - 1);
  }

  heapifyUp(index) {
    while (index > 0) {
      let parentIndex = Math.floor((index - 1) / 2);
      if (self.heap[index].priorityScore <= self.heap[parentIndex].priorityScore) break;
      
      // Swap elements
      [self.heap[index], self.heap[parentIndex]] = [self.heap[parentIndex], self.heap[index]];
      index = parentIndex;
    }
  }

  // 3. Extract Root Node (Highest Priority Case): O(log n)
  extractMax() {
    if (self.heap.length === 0) return null;
    const max = self.heap[0];
    const end = self.heap.pop();
    
    if (self.heap.length > 0) {
      self.heap[0] = end;
      self.heapifyDown(0);
    }
    return max;
  }

  heapifyDown(index) {
    const length = self.heap.length;
    const element = self.heap[index];

    while (true) {
      let leftChildIdx = 2 * index + 1;
      let rightChildIdx = 2 * index + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIdx < length) {
        leftChild = self.heap[leftChildIdx];
        if (leftChild.priorityScore > element.priorityScore) swap = leftChildIdx;
      }

      if (rightChildIdx < length) {
        rightChild = self.heap[rightChildIdx];
        if (
          (swap === null && rightChild.priorityScore > element.priorityScore) ||
          (swap !== null && rightChild.priorityScore > leftChild.priorityScore)
        ) {
          swap = rightChildIdx;
        }
      }

      if (swap === null) break;
      self.heap[index] = self.heap[swap];
      self.heap[swap] = element;
      index = swap;
    }
  }
}