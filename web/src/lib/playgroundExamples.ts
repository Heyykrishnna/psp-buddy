export interface CodeExample {
  id: string;
  title: string;
  language: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  description: string;
  starterCode: string;
  sampleInput: string;
  expectedOutput: string;
  testCases: Array<{
    id: number;
    input: string;
    expected: string;
  }>;
}

export const PLAYGROUND_EXAMPLES: CodeExample[] = [
  // --- PYTHON EXAMPLES ---
  {
    id: "py-two-sum",
    title: "Two Sum (Optimal Hash Map)",
    language: "python",
    difficulty: "Easy",
    category: "Arrays & Hashing",
    description:
      "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nOptimal Time Complexity: O(N)\nSpace Complexity: O(N)",
    starterCode: `def two_sum(nums, target):
    """
    Find two numbers in 'nums' that sum up to 'target'.
    Returns list of indices [index1, index2].
    """
    seen = {}
    for idx, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], idx]
        seen[num] = idx
    return []

# --- Driver Code for Testing ---
if __name__ == "__main__":
    test_nums = [2, 7, 11, 15]
    test_target = 9
    result = two_sum(test_nums, test_target)
    print(f"Input: nums = {test_nums}, target = {test_target}")
    print(f"Output Indices: {result}")
`,
    sampleInput: "nums = [2, 7, 11, 15], target = 9",
    expectedOutput: "[0, 1]",
    testCases: [
      { id: 1, input: "[2, 7, 11, 15], target=9", expected: "[0, 1]" },
      { id: 2, input: "[3, 2, 4], target=6", expected: "[1, 2]" },
      { id: 3, input: "[3, 3], target=6", expected: "[0, 1]" },
    ],
  },
  {
    id: "py-lru-cache",
    title: "LRU Cache Data Structure",
    language: "python",
    difficulty: "Medium",
    category: "Data Structures",
    description:
      "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with get(key) and put(key, value) operations in O(1) time complexity.",
    starterCode: `class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {} # map key to node
        # Head (LRU) <-> Tail (Most Recent)
        self.head, self.tail = Node(), Node()
        self.head.next, self.tail.prev = self.tail, self.head

    def _remove(self, node):
        prev, nxt = node.prev, node.next
        prev.next, nxt.prev = nxt, prev

    def _add_to_tail(self, node):
        prev = self.tail.prev
        prev.next = node
        node.prev = prev
        node.next = self.tail
        self.tail.prev = node

    def get(self, key: int) -> int:
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._add_to_tail(node)
            return node.val
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self._remove(self.cache[key])
        node = Node(key, value)
        self.cache[key] = node
        self._add_to_tail(node)
        
        if len(self.cache) > self.cap:
            lru = self.head.next
            self._remove(lru)
            del self.cache[lru.key]

# Testing LRU Cache
lru = LRUCache(2)
lru.put(1, 100)
lru.put(2, 200)
print("get(1):", lru.get(1)) # returns 100
lru.put(3, 300)             # evicts key 2
print("get(2):", lru.get(2)) # returns -1 (evicted)
`,
    sampleInput: "capacity = 2, put(1,100), put(2,200), get(1), put(3,300), get(2)",
    expectedOutput: "get(1): 100\nget(2): -1",
    testCases: [
      { id: 1, input: "capacity=2, ops=[put, put, get]", expected: "100" },
    ],
  },
  {
    id: "py-bfs-graph",
    title: "Shortest Path BFS (Graph)",
    language: "python",
    difficulty: "Medium",
    category: "Graphs & Searching",
    description:
      "Find the shortest path distance in an unweighted graph from start_node to target_node using Breadth-First Search (BFS).",
    starterCode: `from collections import deque

def shortest_path_bfs(graph, start, target):
    """
    Returns shortest distance from start to target.
    graph: dict where graph[u] = list of neighbors
    """
    if start == target:
        return 0
        
    queue = deque([(start, 0)]) # (node, distance)
    visited = {start}
    
    while queue:
        curr, dist = queue.popleft()
        for neighbor in graph.get(curr, []):
            if neighbor == target:
                return dist + 1
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))
                
    return -1

# Sample Graph:
# 0 -> 1, 2
# 1 -> 3
# 2 -> 3, 4
# 3 -> 5
graph = {
    0: [1, 2],
    1: [3],
    2: [3, 4],
    3: [5],
    4: [5]
}

dist = shortest_path_bfs(graph, 0, 5)
print(f"Shortest distance from 0 to 5: {dist} steps")
`,
    sampleInput: "graph: 0->1,2; 1->3; 2->3,4; 3->5. Start: 0, Target: 5",
    expectedOutput: "Shortest distance from 0 to 5: 3 steps",
    testCases: [
      { id: 1, input: "Start: 0, Target: 5", expected: "3" },
      { id: 2, input: "Start: 0, Target: 4", expected: "2" },
    ],
  },

  // --- JAVASCRIPT / TYPESCRIPT EXAMPLES ---
  {
    id: "js-promise-all",
    title: "Custom Promise.all Implementation",
    language: "javascript",
    difficulty: "Medium",
    category: "Async JS & Utilities",
    description:
      "Implement a custom `myPromiseAll` function that accepts an array of promises and resolves with an array of their results, or rejects as soon as any promise rejects.",
    starterCode: `function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError("Argument must be an array"));
    }

    const results = [];
    let completedCount = 0;

    if (promises.length === 0) {
      return resolve([]);
    }

    promises.forEach((p, index) => {
      Promise.resolve(p)
        .then((val) => {
          results[index] = val;
          completedCount++;
          if (completedCount === promises.length) {
            resolve(results);
          }
        })
        .catch((err) => reject(err));
    });
  });
}

// Driver Test
const task1 = new Promise((res) => setTimeout(() => res("Task 1 Done"), 100));
const task2 = Promise.resolve(42);
const task3 = new Promise((res) => setTimeout(() => res("Task 3 Done"), 50));

myPromiseAll([task1, task2, task3])
  .then((data) => console.log("All Promises Resolved:", data))
  .catch((err) => console.error("Error:", err));
`,
    sampleInput: "promises = [task1 (100ms), task2 (instant), task3 (50ms)]",
    expectedOutput: 'All Promises Resolved: [ "Task 1 Done", 42, "Task 3 Done" ]',
    testCases: [
      { id: 1, input: "[p1, p2, p3]", expected: "All resolved array" },
    ],
  },
  {
    id: "ts-tree-traversal",
    title: "Binary Tree Level Order Traversal",
    language: "typescript",
    difficulty: "Medium",
    category: "Trees & Recursion",
    description:
      "Given the root of a binary tree, return the level order traversal of its nodes' values (i.e. from left to right, level by level).",
    starterCode: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;

  constructor(val: number, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];

  const result: number[][] = [];
  const queue: TreeNode[] = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel: number[] = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}

// Build sample tree: [3, 9, 20, null, null, 15, 7]
const root = new TreeNode(3, 
  new TreeNode(9), 
  new TreeNode(20, new TreeNode(15), new TreeNode(7))
);

console.log("Level Order Traversal:", JSON.stringify(levelOrder(root)));
`,
    sampleInput: "tree = [3, 9, 20, null, null, 15, 7]",
    expectedOutput: "[[3], [9, 20], [15, 7]]",
    testCases: [
      { id: 1, input: "[3, 9, 20, null, null, 15, 7]", expected: "[[3],[9,20],[15,7]]" },
    ],
  },

  // --- C++ EXAMPLES ---
  {
    id: "cpp-topological-sort",
    title: "Kahn's Topological Sort (C++ 20)",
    language: "cpp",
    difficulty: "Medium",
    category: "Graph Algorithms",
    description:
      "Perform topological sorting on a Directed Acyclic Graph (DAG) using Kahn's algorithm (indegree-based BFS).",
    starterCode: `#include <iostream>
#include <vector>
#include <queue>

using namespace std;

vector<int> topologicalSort(int numNodes, const vector<pair<int, int>>& edges) {
    vector<vector<int>> adj(numNodes);
    vector<int> inDegree(numNodes, 0);

    for (const auto& edge : edges) {
        adj[edge.first].push_back(edge.second);
        inDegree[edge.second]++;
    }

    queue<int> q;
    for (int i = 0; i < numNodes; ++i) {
        if (inDegree[i] == 0) q.push(i);
    }

    vector<int> topoOrder;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        topoOrder.push_back(u);

        for (int v : adj[u]) {
            if (--inDegree[v] == 0) {
                q.push(v);
            }
        }
    }

    if (topoOrder.size() != numNodes) {
        return {}; // Graph has a cycle!
    }

    return topoOrder;
}

int main() {
    int nodes = 6;
    vector<pair<int, int>> edges = {
        {5, 2}, {5, 0}, {4, 0}, {4, 1}, {2, 3}, {3, 1}
    };

    vector<int> order = topologicalSort(nodes, edges);
    cout << "Topological Sort Order: ";
    for (int node : order) {
        cout << node << " ";
    }
    cout << endl;
    return 0;
}
`,
    sampleInput: "6 nodes, edges: (5->2, 5->0, 4->0, 4->1, 2->3, 3->1)",
    expectedOutput: "Topological Sort Order: 4 5 0 2 3 1",
    testCases: [
      { id: 1, input: "DAG 6 nodes", expected: "4 5 0 2 3 1" },
    ],
  },
  {
    id: "cpp-segment-tree",
    title: "Segment Tree with Range Sum",
    language: "cpp",
    difficulty: "Hard",
    category: "Advanced Data Structures",
    description:
      "Implement a Segment Tree supporting point updates in O(log N) and range sum queries in O(log N).",
    starterCode: `#include <iostream>
#include <vector>

using namespace std;

class SegmentTree {
private:
    int n;
    vector<int> tree;

    void build(const vector<int>& arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
            return;
        }
        int mid = start + (end - start) / 2;
        build(arr, 2 * node, start, mid);
        build(arr, 2 * node + 1, mid + 1, end);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

public:
    SegmentTree(const vector<int>& arr) {
        n = arr.size();
        tree.resize(4 * n, 0);
        build(arr, 1, 0, n - 1);
    }

    int queryRange(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0; // Completely outside
        if (l <= start && end <= r) return tree[node]; // Completely inside

        int mid = start + (end - start) / 2;
        int p1 = queryRange(2 * node, start, mid, l, r);
        int p2 = queryRange(2 * node + 1, mid + 1, end, l, r);
        return p1 + p2;
    }
};

int main() {
    vector<int> data = {1, 3, 5, 7, 9, 11};
    SegmentTree st(data);

    cout << "Sum of range [1, 3] (3+5+7): " << st.queryRange(1, 0, data.size() - 1, 1, 3) << endl;
    return 0;
}
`,
    sampleInput: "arr = [1, 3, 5, 7, 9, 11], query = range [1, 3]",
    expectedOutput: "Sum of range [1, 3] (3+5+7): 15",
    testCases: [
      { id: 1, input: "range [1, 3]", expected: "15" },
    ],
  },

  // --- JAVA EXAMPLES ---
  {
    id: "java-dijkstra",
    title: "Dijkstra's Algorithm (Java 17)",
    language: "java",
    difficulty: "Medium",
    category: "Graph Algorithms",
    description:
      "Find the shortest path from a source node to all other nodes in a weighted graph using a PriorityQueue (Min-Heap).",
    starterCode: `import java.util.*;

public class Main {
    static class Edge {
        int target, weight;
        Edge(int target, int weight) {
            this.target = target;
            this.weight = weight;
        }
    }

    public static int[] dijkstra(int n, List<List<Edge>> adj, int src) {
        int[] dist = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[src] = 0;

        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
        pq.offer(new int[]{src, 0});

        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int u = curr[0];
            int d = curr[1];

            if (d > dist[u]) continue;

            for (Edge edge : adj.get(u)) {
                if (dist[u] + edge.weight < dist[edge.target]) {
                    dist[edge.target] = dist[u] + edge.weight;
                    pq.offer(new int[]{edge.target, dist[edge.target]});
                }
            }
        }
        return dist;
    }

    public static void main(String[] args) {
        int n = 5;
        List<List<Edge>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

        adj.get(0).add(new Edge(1, 4));
        adj.get(0).add(new Edge(2, 1));
        adj.get(2).add(new Edge(1, 2));
        adj.get(1).add(new Edge(3, 1));
        adj.get(2).add(new Edge(3, 5));

        int[] distances = dijkstra(n, adj, 0);
        System.out.println("Shortest distance from 0 to 3: " + distances[3]);
    }
}
`,
    sampleInput: "5 nodes, edges: (0->1:4, 0->2:1, 2->1:2, 1->3:1)",
    expectedOutput: "Shortest distance from 0 to 3: 4",
    testCases: [
      { id: 1, input: "source=0, target=3", expected: "4" },
    ],
  },

  // --- RUST EXAMPLE ---
  {
    id: "rust-ownership",
    title: "Rust Ownership & Struct Methods",
    language: "rust",
    difficulty: "Easy",
    category: "Systems & Memory",
    description:
      "Demonstrate Rust struct implementation, safe references (`&self`, `&mut self`), and vector operations.",
    starterCode: `struct StudentRegistry {
    name: String,
    scores: Vec<u32>,
}

impl StudentRegistry {
    fn new(name: &str) -> Self {
        StudentRegistry {
            name: name.to_string(),
            scores: Vec::new(),
        }
    }

    fn add_score(&mut self, score: u32) {
        self.scores.push(score);
    }

    fn calculate_average(&self) -> f64 {
        if self.scores.is_empty() {
            return 0.0;
        }
        let sum: u32 = self.scores.iter().sum();
        sum as f64 / self.scores.length() as f64
    }
}

fn main() {
    let mut student = StudentRegistry::new("Alex");
    student.add_score(90);
    student.add_score(85);
    student.add_score(95);

    println!("Student: {}", student.name);
    println!("Average Score: {:.2}", student.calculate_average());
}
`,
    sampleInput: "Student: Alex, Scores: [90, 85, 95]",
    expectedOutput: "Student: Alex\nAverage Score: 90.00",
    testCases: [
      { id: 1, input: "scores: [90, 85, 95]", expected: "90.00" },
    ],
  },

  // --- GO EXAMPLE ---
  {
    id: "go-channels",
    title: "Go Worker Pool with Channels",
    language: "go",
    difficulty: "Medium",
    category: "Concurrency",
    description:
      "Implement a concurrent worker pool using goroutines and buffered channels to process jobs in parallel.",
    starterCode: `package main

import (
	"fmt"
	"time"
)

func worker(id int, jobs <-chan int, results chan<- int) {
	for j := range jobs {
		fmt.Printf("Worker %d processing job %d\n", id, j)
		time.Sleep(50 * time.Millisecond) // Simulate work
		results <- j * 2
	}
}

func main() {
	const numJobs = 5
	jobs := make(chan int, numJobs)
	results := make(chan int, numJobs)

	// Spawn 3 workers
	for w := 1; w <= 3; w++ {
		go worker(w, jobs, results)
	}

	// Send jobs
	for j := 1; j <= numJobs; j++ {
		jobs <- j
	}
	close(jobs)

	// Collect results
	for a := 1; a <= numJobs; a++ {
		res := <-results
		fmt.Printf("Job result collected: %d\n", res)
	}
}
`,
    sampleInput: "5 jobs sent across 3 concurrent workers",
    expectedOutput: "Job result collected: 2\nJob result collected: 4...",
    testCases: [
      { id: 1, input: "5 jobs", expected: "5 results processed" },
    ],
  },

  // --- SQL EXAMPLE ---
  {
    id: "sql-cte-window",
    title: "SQL Window Functions & CTE",
    language: "sql",
    difficulty: "Medium",
    category: "Database & Queries",
    description:
      "Find the top 2 highest-earning employees in each department using `DENSE_RANK()` and a Common Table Expression (CTE).",
    starterCode: `-- Common Table Expression (CTE) to compute department salary rankings
WITH RankedEmployees AS (
    SELECT 
        emp_id,
        first_name,
        department_name,
        salary,
        DENSE_RANK() OVER (
            PARTITION BY department_name 
            ORDER BY salary DESC
        ) AS salary_rank
    FROM employees
)
SELECT 
    department_name,
    first_name,
    salary,
    salary_rank
FROM RankedEmployees
WHERE salary_rank <= 2
ORDER BY department_name, salary_rank;
`,
    sampleInput: "employees table with emp_id, name, department_name, salary",
    expectedOutput: "Top 2 highest paid per department",
    testCases: [
      { id: 1, input: "Ranked CTE", expected: "salary_rank <= 2" },
    ],
  },
];
