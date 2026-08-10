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

export const QUESTION_SETS: QuestionSet[] = [
  {
    id: 1,
    levels: {
      1: {
        type: "riddle",
        question: "I repeat myself until the condition is false. Who am I?",
        answer: "while loop",
      },
      2: {
        type: "output",
        language: "python",
        code: `numbers = [2, 4, 6, 8]
result = []
for num in numbers:
    if num % 4 == 0:
        result.append(num * 2)
print(result)`,
        answer: "[16]",
      },
      3: {
        type: "detective",
        language: "python",
        code: `let score = 100;
if (score = 100) {
  console.log("ACCESS GRANTED");
} else {
  console.log("ACCESS DENIED");
}`,
        bugDescription: "The program is not working as expected. Find and fix the bug.",
        correctFix: "assignment instead of comparison",
        options: [
          "Missing semicolon",
          "Assignment instead of comparison",
          "Wrong variable name",
          "Syntax error in else",
        ],
      },
      4: {
        type: "logic",
        locks: [
          { id: 1, question: "What is the output of: print(2 ** 3 + 1)?", answer: "9" },
          { id: 2, question: "True and False or True evaluates to?", answer: "true" },
          { id: 3, question: "len('code') + len('quest') = ?", answer: "9" },
        ],
      },
      5: {
        type: "arrangement",
        language: "python",
        description: "Arrange the lines to correctly find the maximum in a list.",
        correctLines: [
          "def find_max(arr):",
          "    if not arr:",
          "        return None",
          "    max_val = arr[0]",
          "    for num in arr[1:]:",
          "        if num > max_val:",
          "            max_val = num",
          "    return max_val",
        ],
      },
      6: {
        type: "memory",
        language: "python",
        code: `def unique_sum(arr):
    return sum(set(arr))

print(unique_sum([1, 2, 2, 3, 4, 4]))`,
        output: "10",
      },
    },
  },
  {
    id: 2,
    levels: {
      1: {
        type: "riddle",
        question: "I store multiple values of the same type and am indexed from zero. Who am I?",
        answer: "array",
      },
      2: {
        type: "output",
        language: "java",
        code: `public class Main {
  public static void main(String[] args) {
    int x = 5;
    System.out.println(x++ + ++x);
  }
}`,
        answer: "12",
      },
      3: {
        type: "detective",
        language: "java",
        code: `int[] nums = {1, 2, 3};
for(int i = 0; i <= nums.length; i++) {
  System.out.println(nums[i]);
}`,
        bugDescription: "ArrayIndexOutOfBoundsException. Find the bug.",
        correctFix: "off by one",
        options: [
          "Off-by-one error in loop condition",
          "Missing import",
          "Wrong array type",
          "Null pointer",
        ],
      },
      4: {
        type: "logic",
        locks: [
          { id: 1, question: "In Java, what is 10 % 3?", answer: "1" },
          { id: 2, question: "Boolean result of (5 > 3 && 2 < 4)", answer: "true" },
          { id: 3, question: "String length of \"Hello\".length()", answer: "5" },
        ],
      },
      5: {
        type: "arrangement",
        language: "java",
        description: "Arrange to correctly reverse a string.",
        correctLines: [
          "public static String reverse(String s) {",
          "    StringBuilder sb = new StringBuilder();",
          "    for(int i = s.length() - 1; i >= 0; i--) {",
          "        sb.append(s.charAt(i));",
          "    }",
          "    return sb.toString();",
          "}",
        ],
      },
      6: {
        type: "memory",
        language: "java",
        code: `int sum = 0;
for(int i = 1; i <= 5; i++) {
  if(i % 2 == 0) continue;
  sum += i;
}
System.out.println(sum);`,
        output: "9",
      },
    },
  },
  {
    id: 3,
    levels: {
      1: {
        type: "riddle",
        question: "I am called to perform a specific task and can return a value. Who am I?",
        answer: "function",
      },
      2: {
        type: "output",
        language: "python",
        code: `x = [1, 2, 3]
y = x
y.append(4)
print(x)`,
        answer: "[1, 2, 3, 4]",
      },
      3: {
        type: "detective",
        language: "python",
        code: `def greet(name):
print("Hello " + name)

greet("Explorer")`,
        bugDescription: "IndentationError. Fix the code.",
        correctFix: "indentation",
        options: ["Missing colon", "Indentation error", "Wrong string concat", "Missing return"],
      },
      4: {
        type: "logic",
        locks: [
          { id: 1, question: "What is type([]) in Python?", answer: "list" },
          { id: 2, question: "3 * 'ab' produces?", answer: "ababab" },
          { id: 3, question: "bool('') is?", answer: "false" },
        ],
      },
      5: {
        type: "arrangement",
        language: "python",
        description: "Arrange lines for a correct factorial function.",
        correctLines: [
          "def factorial(n):",
          "    if n <= 1:",
          "        return 1",
          "    return n * factorial(n - 1)",
        ],
      },
      6: {
        type: "memory",
        language: "python",
        code: `d = {"a": 1, "b": 2}
print(list(d.keys())[0] + str(d["b"]))`,
        output: "a2",
      },
    },
  },
  {
    id: 4,
    levels: {
      1: {
        type: "riddle",
        question: "I hold a single value and my type is determined at runtime in Python. Who am I?",
        answer: "variable",
      },
      2: {
        type: "output",
        language: "java",
        code: `String s = "Code";
s = s + "Quest";
System.out.println(s.length());`,
        answer: "9",
      },
      3: {
        type: "detective",
        language: "java",
        code: `public class Test {
  public static void main(String[] args) {
    int a = 10;
    int b = 0;
    System.out.println(a / b);
  }
}`,
        bugDescription: "Runtime exception. Identify the issue.",
        correctFix: "division by zero",
        options: ["Division by zero", "Null pointer", "Class not found", "Stack overflow"],
      },
      4: {
        type: "logic",
        locks: [
          { id: 1, question: "Java: System.out.println(5 + 3 + \"2\"); prints?", answer: "82" },
          { id: 2, question: "Is '==' and '.equals()' the same for Strings?", answer: "no" },
          { id: 3, question: "What keyword prevents inheritance?", answer: "final" },
        ],
      },
      5: {
        type: "arrangement",
        language: "java",
        description: "Arrange to check if a number is prime.",
        correctLines: [
          "public static boolean isPrime(int n) {",
          "    if (n <= 1) return false;",
          "    for (int i = 2; i * i <= n; i++) {",
          "        if (n % i == 0) return false;",
          "    }",
          "    return true;",
          "}",
        ],
      },
      6: {
        type: "memory",
        language: "java",
        code: `int[] arr = {3, 1, 4, 1, 5};
int max = arr[0];
for(int n : arr) if(n > max) max = n;
System.out.println(max);`,
        output: "5",
      },
    },
  },
  {
    id: 5,
    levels: {
      1: {
        type: "riddle",
        question: "I am a special method that initializes an object. Who am I in Java?",
        answer: "constructor",
      },
      2: {
        type: "output",
        language: "python",
        code: `print([i**2 for i in range(4) if i % 2 == 0])`,
        answer: "[0, 4]",
      },
      3: {
        type: "detective",
        language: "python",
        code: `nums = [1, 2, 3]
print(nums[3])`,
        bugDescription: "IndexError. What is wrong?",
        correctFix: "index out of range",
        options: ["Index out of range", "Type error", "Syntax error", "Name error"],
      },
      4: {
        type: "logic",
        locks: [
          { id: 1, question: "Python: 7 // 2 equals?", answer: "3" },
          { id: 2, question: "What does 'in' operator check?", answer: "membership" },
          { id: 3, question: "type(None) is?", answer: "nonetype" },
        ],
      },
      5: {
        type: "arrangement",
        language: "python",
        description: "Arrange for binary search (assuming sorted list).",
        correctLines: [
          "def binary_search(arr, target):",
          "    low, high = 0, len(arr) - 1",
          "    while low <= high:",
          "        mid = (low + high) // 2",
          "        if arr[mid] == target:",
          "            return mid",
          "        elif arr[mid] < target:",
          "            low = mid + 1",
          "        else:",
          "            high = mid - 1",
          "    return -1",
        ],
      },
      6: {
        type: "memory",
        language: "python",
        code: `s = "quest"
print(s[::-1].upper())`,
        output: "TSEUQ",
      },
    },
  },
  {
    id: 6,
    levels: {
      1: {
        type: "riddle",
        question: "I allow a class to inherit properties from another class. Who am I?",
        answer: "inheritance",
      },
      2: {
        type: "output",
        language: "java",
        code: `int i = 0;
do {
  i++;
} while(i < 3);
System.out.println(i);`,
        answer: "3",
      },
      3: {
        type: "detective",
        language: "java",
        code: `String str = null;
System.out.println(str.length());`,
        bugDescription: "NullPointerException. Identify cause.",
        correctFix: "null reference",
        options: ["Null reference", "Out of memory", "Class cast", "Illegal argument"],
      },
      4: {
        type: "logic",
        locks: [
          { id: 1, question: "Java default value of boolean?", answer: "false" },
          { id: 2, question: "Which loop is guaranteed to run at least once?", answer: "do while" },
          { id: 3, question: "What is the size of int in Java (bits)?", answer: "32" },
        ],
      },
      5: {
        type: "arrangement",
        language: "java",
        description: "Arrange to calculate sum of unique elements.",
        correctLines: [
          "public static int uniqueSum(int[] arr) {",
          "    java.util.Set<Integer> set = new java.util.HashSet<>();",
          "    for(int n : arr) set.add(n);",
          "    int sum = 0;",
          "    for(int n : set) sum += n;",
          "    return sum;",
          "}",
        ],
      },
      6: {
        type: "memory",
        language: "java",
        code: `String msg = "CODE";
msg = msg.toLowerCase();
System.out.println(msg.charAt(0) + "" + msg.length());`,
        output: "c4",
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
