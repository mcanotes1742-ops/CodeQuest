export type Language = "python" | "java";

export interface Level1Riddle {
  type: "riddle";
  question: string;
  answer: string;
}

export interface Level2Output {
  type: "output";
  language: Language;
  code: string;
  answer: string;
}

export interface Level3Detective {
  type: "detective";
  language: Language;
  code: string;
  bugDescription: string;
  correctFix: string;
  options?: string[];
}

export interface Level4LogicLock {
  type: "logic";
  locks: { id: number; question: string; answer: string }[];
}

export interface Level5Arrangement {
  type: "arrangement";
  language: Language;
  correctLines: string[];
  description: string;
}

export interface Level6Memory {
  type: "memory";
  language: Language;
  code: string;
  output: string;
}

export interface QuestionSet {
  id: number;
  levels: {
    1: Level1Riddle;
    2: Level2Output;
    3: Level3Detective;
    4: Level4LogicLock;
    5: Level5Arrangement;
    6: Level6Memory;
  };
}

/**
 * 6 medium→hard question sets
 * Level map:
 *  1 = Code Riddle
 *  2 = Output Hunt
 *  3 = Code Detective
 *  4 = Logic Lock (3 locks)
 *  5 = Code Arrangement
 *  6 = Master Vault (memory)
 */
export const QUESTION_SETS: QuestionSet[] = [
  // ==================== SET 1 ====================
  {
    id: 1,
    levels: {
      1: {
        type: "riddle",
        question:
          "I stay the same after creation; any 'change' creates a new me. Strings in Java and tuples in Python love me. What concept am I?",
        answer: "immutability",
      },
      2: {
        type: "output",
        language: "python",
        code: `def f(a, b=[]):
    b.append(a)
    return b

print(f(1), f(2), f(3, []))`,
        answer: "[1, 2] [1, 2] [3]",
      },
      3: {
        type: "detective",
        language: "python",
        code: `nums = [1, 2, 3, 4]
for i in range(len(nums)):
    if nums[i] % 2 == 0:
        nums.remove(nums[i])
print(nums)`,
        bugDescription: "Even numbers should be removed, but this crashes or skips values. Find the bug.",
        correctFix: "modifying list while iterating",
        options: [
          "Index starts at 1 instead of 0",
          "Modifying list while iterating",
          "Wrong modulo operator",
          "print uses wrong variable",
        ],
      },
      4: {
        type: "logic",
        locks: [
          {
            id: 1,
            question: "bool([]) == bool('') == bool(0) evaluates to?",
            answer: "true",
          },
          {
            id: 2,
            question: "[x for x in range(5) if x % 2] produces?",
            answer: "[1, 3]",
          },
          {
            id: 3,
            question: "Average time to check if an item is in a Python set?",
            answer: "o(1)",
          },
        ],
      },
      5: {
        type: "arrangement",
        language: "python",
        description: "Arrange lines to implement binary search (return index or -1).",
        correctLines: [
          "def binary_search(arr, target):",
          "    lo, hi = 0, len(arr) - 1",
          "    while lo <= hi:",
          "        mid = (lo + hi) // 2",
          "        if arr[mid] == target:",
          "            return mid",
          "        if arr[mid] < target:",
          "            lo = mid + 1",
          "        else:",
          "            hi = mid - 1",
          "    return -1",
        ],
      },
      6: {
        type: "memory",
        language: "python",
        code: `def mystery(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print(mystery(6))`,
        output: "8",
      },
    },
  },

  // ==================== SET 2 ====================
  {
    id: 2,
    levels: {
      1: {
        type: "riddle",
        question:
          "Only one instance of me is allowed in the whole app. Misused, I become hidden global state. What design pattern am I?",
        answer: "singleton",
      },
      2: {
        type: "output",
        language: "java",
        code: `public class Main {
  public static void main(String[] args) {
    String a = "code";
    String b = "code";
    String c = new String("code");
    System.out.print((a == b) + " " + (a == c) + " " + a.equals(c));
  }
}`,
        answer: "true false true",
      },
      3: {
        type: "detective",
        language: "java",
        code: `int[] arr = {10, 20, 30};
for (int i = 0; i <= arr.length; i++) {
  System.out.println(arr[i]);
}`,
        bugDescription: "This throws ArrayIndexOutOfBoundsException. Why?",
        correctFix: "off-by-one in loop condition",
        options: [
          "Array is null",
          "Off-by-one in loop condition",
          "Wrong array type",
          "Missing break statement",
        ],
      },
      4: {
        type: "logic",
        locks: [
          {
            id: 1,
            question: "Default value of an uninitialized boolean field in Java?",
            answer: "false",
          },
          {
            id: 2,
            question: "Which collection forbids duplicate elements?",
            answer: "set",
          },
          {
            id: 3,
            question: "What is the value of 5 << 1 in Java?",
            answer: "10",
          },
        ],
      },
      5: {
        type: "arrangement",
        language: "java",
        description: "Arrange lines to reverse a string with StringBuilder.",
        correctLines: [
          "public static String reverse(String s) {",
          "    StringBuilder sb = new StringBuilder();",
          "    for (int i = s.length() - 1; i >= 0; i--) {",
          "        sb.append(s.charAt(i));",
          "    }",
          "    return sb.toString();",
          "}",
        ],
      },
      6: {
        type: "memory",
        language: "java",
        code: `int x = 5;
int y = x++ + ++x;
System.out.println(y);`,
        output: "12",
      },
    },
  },

  // ==================== SET 3 ====================
  {
    id: 3,
    levels: {
      1: {
        type: "riddle",
        question:
          "I grow by doubling capacity under the hood, give amortized O(1) append, and waste some empty slots. What structure am I?",
        answer: "dynamic array",
      },
      2: {
        type: "output",
        language: "python",
        code: `a = [1, 2, 3]
b = a
b.append(4)
print(a is b, a)`,
        answer: "true [1, 2, 3, 4]",
      },
      3: {
        type: "detective",
        language: "python",
        code: `def average(nums):
    total = 0
    for n in nums:
        total += n
    return total / len(nums)

print(average([]))`,
        bugDescription: "Calling average([]) crashes. What is the bug?",
        correctFix: "division by zero on empty list",
        options: [
          "Missing return type",
          "Division by zero on empty list",
          "Wrong loop variable",
          "total should start at 1",
        ],
      },
      4: {
        type: "logic",
        locks: [
          {
            id: 1,
            question: "Result of {1, 2, 3} & {2, 3, 4} in Python?",
            answer: "{2, 3}",
          },
          {
            id: 2,
            question: "Worst-case time complexity of merge sort?",
            answer: "o(n log n)",
          },
          {
            id: 3,
            question: "Which stack operation removes the top element?",
            answer: "pop",
          },
        ],
      },
      5: {
        type: "arrangement",
        language: "python",
        description: "Arrange lines for iterative factorial.",
        correctLines: [
          "def factorial(n):",
          "    if n < 0:",
          "        raise ValueError('n must be >= 0')",
          "    result = 1",
          "    for i in range(2, n + 1):",
          "        result *= i",
          "    return result",
        ],
      },
      6: {
        type: "memory",
        language: "python",
        code: `s = "abracadabra"
print(s.count("a"), s.find("cad"), s[::-1][:3])`,
        output: "5 4 arb",
      },
    },
  },

  // ==================== SET 4 ====================
  {
    id: 4,
    levels: {
      1: {
        type: "riddle",
        question:
          "I map keys to values in average O(1). Too many collisions and I slow down badly. What am I?",
        answer: "hash table",
      },
      2: {
        type: "output",
        language: "java",
        code: `public class Main {
  public static void main(String[] args) {
    System.out.println(5 + 3 + "2" + 1 + 1);
  }
}`,
        answer: "8211",
      },
      3: {
        type: "detective",
        language: "java",
        code: `String s = null;
if (s.equals("test")) {
  System.out.println("match");
}`,
        bugDescription: "This throws NullPointerException. What is wrong?",
        correctFix: "calling method on null reference",
        options: [
          "Missing semicolon",
          "Calling method on null reference",
          "Wrong string comparison operator",
          "Variable not declared",
        ],
      },
      4: {
        type: "logic",
        locks: [
          {
            id: 1,
            question: "Java interface methods are _____ by default (classic style).",
            answer: "abstract",
          },
          {
            id: 2,
            question: "Keyword that prevents a class from being extended?",
            answer: "final",
          },
          {
            id: 3,
            question: "Size of int in Java (bits)?",
            answer: "32",
          },
        ],
      },
      5: {
        type: "arrangement",
        language: "java",
        description: "Arrange lines to check if a number is prime.",
        correctLines: [
          "public static boolean isPrime(int n) {",
          "    if (n <= 1) return false;",
          "    if (n <= 3) return true;",
          "    if (n % 2 == 0 || n % 3 == 0) return false;",
          "    for (int i = 5; i * i <= n; i += 6) {",
          "        if (n % i == 0 || n % (i + 2) == 0) return false;",
          "    }",
          "    return true;",
          "}",
        ],
      },
      6: {
        type: "memory",
        language: "java",
        code: `int[] a = {1, 2, 3};
int sum = 0;
for (int v : a) sum += v * v;
System.out.println(sum);`,
        output: "14",
      },
    },
  },

  // ==================== SET 5 ====================
  {
    id: 5,
    levels: {
      1: {
        type: "riddle",
        question:
          "I explore a graph level by level using a queue and a visited set. What algorithm am I?",
        answer: "bfs",
      },
      2: {
        type: "output",
        language: "python",
        code: `def wrap(fn):
    def inner(x):
        return fn(x) + 1
    return inner

@wrap
def double(x):
    return x * 2

print(double(3))`,
        answer: "7",
      },
      3: {
        type: "detective",
        language: "python",
        code: `d = {"a": 1, "b": 2}
for k in d:
    if k == "a":
        del d[k]
print(d)`,
        bugDescription: "This raises RuntimeError. What is the bug?",
        correctFix: "deleting dict key while iterating",
        options: [
          "Key 'a' does not exist",
          "Deleting dict key while iterating",
          "print cannot print dict",
          "Wrong comparison operator",
        ],
      },
      4: {
        type: "logic",
        locks: [
          {
            id: 1,
            question: "Output of sorted({3, 1, 2})?",
            answer: "[1, 2, 3]",
          },
          {
            id: 2,
            question: "Tree traversal: root, then left, then right?",
            answer: "preorder",
          },
          {
            id: 3,
            question: "Average recursive space of quicksort?",
            answer: "o(log n)",
          },
        ],
      },
      5: {
        type: "arrangement",
        language: "python",
        description: "Arrange lines for DFS on an adjacency-list graph.",
        correctLines: [
          "def dfs(graph, start, visited=None):",
          "    if visited is None:",
          "        visited = set()",
          "    visited.add(start)",
          "    for neighbor in graph.get(start, []):",
          "        if neighbor not in visited:",
          "            dfs(graph, neighbor, visited)",
          "    return visited",
        ],
      },
      6: {
        type: "memory",
        language: "python",
        code: `from functools import reduce
nums = [1, 2, 3, 4]
print(reduce(lambda a, b: a * b, nums, 1))`,
        output: "24",
      },
    },
  },

// ==================== SET 6 ====================
{
  id: 6,
  levels: {
    1: {
      type: "riddle",
      question:
        "I store key-value pairs, and every key must be unique. In Java, what collection am I?",
      answer: "hashmap",
    },

    2: {
      type: "output",
      language: "java",
      code: `public class Main {
  public static void main(String[] args) {
    int x = 3;
    int y = 4;
    System.out.println(x * y + x);
  }
}`,
      answer: "15",
    },

    3: {
      type: "detective",
      language: "java",
      code: `public class Main {
  public static void main(String[] args) {
    String name = null;
    System.out.println(name.length());
  }
}`,
      bugDescription:
        "The program throws a NullPointerException. What is the bug?",
      correctFix: "calling length() on a null reference",
      options: [
        "String is too long",
        "Calling length() on a null reference",
        "length() is not a Java method",
        "String must be static",
      ],
    },

    4: {
      type: "logic",
      locks: [
        {
          id: 1,
          question: "Which data structure follows FIFO order?",
          answer: "queue",
        },
        {
          id: 2,
          question: "What keyword is used to inherit a class in Java?",
          answer: "extends",
        },
        {
          id: 3,
          question:
            "What is the time complexity of accessing an element by index in an array?",
          answer: "o(1)",
        },
      ],
    },

    5: {
      type: "arrangement",
      language: "java",
      description:
        "Arrange the lines to create a Java method that finds the maximum value in an integer array.",
      correctLines: [
        "public static int findMax(int[] arr) {",
        "    int max = arr[0];",
        "    for (int i = 1; i < arr.length; i++) {",
        "        if (arr[i] > max) {",
        "            max = arr[i];",
        "        }",
        "    }",
        "    return max;",
        "}",
      ],
    },

    6: {
      type: "memory",
      language: "java",
      code: `int[] nums = {4, 7, 2, 9};
int sum = 0;
for (int n : nums) {
  if (n > 4) sum += n;
}
System.out.println(sum);`,
      output: "16",
    },
  },
},
];

export function getRandomSetId(): number {
  return Math.floor(Math.random() * QUESTION_SETS.length) + 1;
}

export function getSetById(id: number): QuestionSet | undefined {
  return QUESTION_SETS.find((s) => s.id === id);
}
