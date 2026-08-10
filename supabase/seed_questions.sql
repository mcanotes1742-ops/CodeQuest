-- ============================================================
-- SEED: 6 Question Sets + all levels
-- RUN ONLY AFTER schema.sql has succeeded
-- ============================================================

-- Safe clear
truncate table public.levels cascade;
truncate table public.question_sets cascade;

-- Sets
insert into public.question_sets (id, name) values
  (1, 'Set Alpha'),
  (2, 'Set Beta'),
  (3, 'Set Gamma'),
  (4, 'Set Delta'),
  (5, 'Set Epsilon'),
  (6, 'Set Zeta');

-- ===================== SET 1 =====================
insert into public.levels (set_id, level_number, level_type, language, question_text, code_snippet, description, options, correct_answer, correct_lines, extra_data) values
(1, 1, 'riddle', null,
  'I repeat myself until the condition is false. Who am I?',
  null, null, null, 'while loop', null, null),

(1, 2, 'output', 'python',
  'Predict the output of the following code.',
  E'numbers = [2, 4, 6, 8]\nresult = []\nfor num in numbers:\n    if num % 4 == 0:\n        result.append(num * 2)\nprint(result)',
  null, null, '[16]', null, null),

(1, 3, 'detective', 'python',
  'The program is not working as expected. Find and fix the bug.',
  E'let score = 100;\nif (score = 100) {\n  console.log("ACCESS GRANTED");\n} else {\n  console.log("ACCESS DENIED");\n}',
  null,
  '["Missing semicolon", "Assignment instead of comparison", "Wrong variable name", "Syntax error in else"]'::jsonb,
  'assignment instead of comparison', null, null),

(1, 4, 'logic', null,
  'Solve all three logic locks.',
  null, null, null, null, null,
  '{"locks":[{"id":1,"question":"What is the output of: print(2 ** 3 + 1)?","answer":"9"},{"id":2,"question":"True and False or True evaluates to?","answer":"true"},{"id":3,"question":"len(''code'') + len(''quest'') = ?","answer":"9"}]}'::jsonb),

(1, 5, 'arrangement', 'python',
  'Arrange the lines to correctly find the maximum in a list.',
  null, 'Arrange the lines to correctly find the maximum in a list.', null, null,
  '["def find_max(arr):","    if not arr:","        return None","    max_val = arr[0]","    for num in arr[1:]:","        if num > max_val:","            max_val = num","    return max_val"]'::jsonb,
  null),

(1, 6, 'memory', 'python',
  'Memorize the code and answer from memory.',
  E'def unique_sum(arr):\n    return sum(set(arr))\n\nprint(unique_sum([1, 2, 2, 3, 4, 4]))',
  null, null, '10', null, null);

-- ===================== SET 2 =====================
insert into public.levels (set_id, level_number, level_type, language, question_text, code_snippet, description, options, correct_answer, correct_lines, extra_data) values
(2, 1, 'riddle', null,
  'I store multiple values of the same type and am indexed from zero. Who am I?',
  null, null, null, 'array', null, null),

(2, 2, 'output', 'java',
  'Predict the output of the following code.',
  E'public class Main {\n  public static void main(String[] args) {\n    int x = 5;\n    System.out.println(x++ + ++x);\n  }\n}',
  null, null, '12', null, null),

(2, 3, 'detective', 'java',
  'ArrayIndexOutOfBoundsException. Find the bug.',
  E'int[] nums = {1, 2, 3};\nfor(int i = 0; i <= nums.length; i++) {\n  System.out.println(nums[i]);\n}',
  null,
  '["Off-by-one error in loop condition", "Missing import", "Wrong array type", "Null pointer"]'::jsonb,
  'off by one', null, null),

(2, 4, 'logic', null,
  'Solve all three logic locks.',
  null, null, null, null, null,
  '{"locks":[{"id":1,"question":"In Java, what is 10 % 3?","answer":"1"},{"id":2,"question":"Boolean result of (5 > 3 && 2 < 4)","answer":"true"},{"id":3,"question":"String length of \\"Hello\\".length()","answer":"5"}]}'::jsonb),

(2, 5, 'arrangement', 'java',
  'Arrange to correctly reverse a string.',
  null, 'Arrange to correctly reverse a string.', null, null,
  '["public static String reverse(String s) {","    StringBuilder sb = new StringBuilder();","    for(int i = s.length() - 1; i >= 0; i--) {","        sb.append(s.charAt(i));","    }","    return sb.toString();","}"]'::jsonb,
  null),

(2, 6, 'memory', 'java',
  'Memorize the code and answer from memory.',
  E'int sum = 0;\nfor(int i = 1; i <= 5; i++) {\n  if(i % 2 == 0) continue;\n  sum += i;\n}\nSystem.out.println(sum);',
  null, null, '9', null, null);

-- ===================== SET 3 =====================
insert into public.levels (set_id, level_number, level_type, language, question_text, code_snippet, description, options, correct_answer, correct_lines, extra_data) values
(3, 1, 'riddle', null,
  'I am called to perform a specific task and can return a value. Who am I?',
  null, null, null, 'function', null, null),

(3, 2, 'output', 'python',
  'Predict the output.',
  E'x = [1, 2, 3]\ny = x\ny.append(4)\nprint(x)',
  null, null, '[1, 2, 3, 4]', null, null),

(3, 3, 'detective', 'python',
  'IndentationError. Fix the code.',
  E'def greet(name):\nprint("Hello " + name)\n\ngreet("Explorer")',
  null,
  '["Missing colon", "Indentation error", "Wrong string concat", "Missing return"]'::jsonb,
  'indentation', null, null),

(3, 4, 'logic', null,
  'Solve all three logic locks.',
  null, null, null, null, null,
  '{"locks":[{"id":1,"question":"What is type([]) in Python?","answer":"list"},{"id":2,"question":"3 * ''ab'' produces?","answer":"ababab"},{"id":3,"question":"bool('''') is?","answer":"false"}]}'::jsonb),

(3, 5, 'arrangement', 'python',
  'Arrange lines for a correct factorial function.',
  null, 'Arrange lines for a correct factorial function.', null, null,
  '["def factorial(n):","    if n <= 1:","        return 1","    return n * factorial(n - 1)"]'::jsonb,
  null),

(3, 6, 'memory', 'python',
  'Memorize the code and answer from memory.',
  E'd = {"a": 1, "b": 2}\nprint(list(d.keys())[0] + str(d["b"]))',
  null, null, 'a2', null, null);

-- ===================== SET 4 =====================
insert into public.levels (set_id, level_number, level_type, language, question_text, code_snippet, description, options, correct_answer, correct_lines, extra_data) values
(4, 1, 'riddle', null,
  'I hold a single value and my type is determined at runtime in Python. Who am I?',
  null, null, null, 'variable', null, null),

(4, 2, 'output', 'java',
  'Predict the output.',
  E'String s = "Code";\ns = s + "Quest";\nSystem.out.println(s.length());',
  null, null, '9', null, null),

(4, 3, 'detective', 'java',
  'Runtime exception. Identify the issue.',
  E'public class Test {\n  public static void main(String[] args) {\n    int a = 10;\n    int b = 0;\n    System.out.println(a / b);\n  }\n}',
  null,
  '["Division by zero", "Null pointer", "Class not found", "Stack overflow"]'::jsonb,
  'division by zero', null, null),

(4, 4, 'logic', null,
  'Solve all three logic locks.',
  null, null, null, null, null,
  '{"locks":[{"id":1,"question":"Java: System.out.println(5 + 3 + \\"2\\"); prints?","answer":"82"},{"id":2,"question":"Is ''=='' and ''.equals()'' the same for Strings?","answer":"no"},{"id":3,"question":"What keyword prevents inheritance?","answer":"final"}]}'::jsonb),

(4, 5, 'arrangement', 'java',
  'Arrange to check if a number is prime.',
  null, 'Arrange to check if a number is prime.', null, null,
  '["public static boolean isPrime(int n) {","    if (n <= 1) return false;","    for (int i = 2; i * i <= n; i++) {","        if (n % i == 0) return false;","    }","    return true;","}"]'::jsonb,
  null),

(4, 6, 'memory', 'java',
  'Memorize the code and answer from memory.',
  E'int[] arr = {3, 1, 4, 1, 5};\nint max = arr[0];\nfor(int n : arr) if(n > max) max = n;\nSystem.out.println(max);',
  null, null, '5', null, null);

-- ===================== SET 5 =====================
insert into public.levels (set_id, level_number, level_type, language, question_text, code_snippet, description, options, correct_answer, correct_lines, extra_data) values
(5, 1, 'riddle', null,
  'I am a special method that initializes an object. Who am I in Java?',
  null, null, null, 'constructor', null, null),

(5, 2, 'output', 'python',
  'Predict the output.',
  E'print([i**2 for i in range(4) if i % 2 == 0])',
  null, null, '[0, 4]', null, null),

(5, 3, 'detective', 'python',
  'IndexError. What is wrong?',
  E'nums = [1, 2, 3]\nprint(nums[3])',
  null,
  '["Index out of range", "Type error", "Syntax error", "Name error"]'::jsonb,
  'index out of range', null, null),

(5, 4, 'logic', null,
  'Solve all three logic locks.',
  null, null, null, null, null,
  '{"locks":[{"id":1,"question":"Python: 7 // 2 equals?","answer":"3"},{"id":2,"question":"What does ''in'' operator check?","answer":"membership"},{"id":3,"question":"type(None) is?","answer":"nonetype"}]}'::jsonb),

(5, 5, 'arrangement', 'python',
  'Arrange for binary search (assuming sorted list).',
  null, 'Arrange for binary search (assuming sorted list).', null, null,
  '["def binary_search(arr, target):","    low, high = 0, len(arr) - 1","    while low <= high:","        mid = (low + high) // 2","        if arr[mid] == target:","            return mid","        elif arr[mid] < target:","            low = mid + 1","        else:","            high = mid - 1","    return -1"]'::jsonb,
  null),

(5, 6, 'memory', 'python',
  'Memorize the code and answer from memory.',
  E's = "quest"\nprint(s[::-1].upper())',
  null, null, 'TSEUQ', null, null);

-- ===================== SET 6 =====================
insert into public.levels (set_id, level_number, level_type, language, question_text, code_snippet, description, options, correct_answer, correct_lines, extra_data) values
(6, 1, 'riddle', null,
  'I allow a class to inherit properties from another class. Who am I?',
  null, null, null, 'inheritance', null, null),

(6, 2, 'output', 'java',
  'Predict the output.',
  E'int i = 0;\ndo {\n  i++;\n} while(i < 3);\nSystem.out.println(i);',
  null, null, '3', null, null),

(6, 3, 'detective', 'java',
  'NullPointerException. Identify cause.',
  E'String str = null;\nSystem.out.println(str.length());',
  null,
  '["Null reference", "Out of memory", "Class cast", "Illegal argument"]'::jsonb,
  'null reference', null, null),

(6, 4, 'logic', null,
  'Solve all three logic locks.',
  null, null, null, null, null,
  '{"locks":[{"id":1,"question":"Java default value of boolean?","answer":"false"},{"id":2,"question":"Which loop is guaranteed to run at least once?","answer":"do while"},{"id":3,"question":"What is the size of int in Java (bits)?","answer":"32"}]}'::jsonb),

(6, 5, 'arrangement', 'java',
  'Arrange to calculate sum of unique elements.',
  null, 'Arrange to calculate sum of unique elements.', null, null,
  '["public static int uniqueSum(int[] arr) {","    java.util.Set<Integer> set = new java.util.HashSet<>();","    for(int n : arr) set.add(n);","    int sum = 0;","    for(int n : set) sum += n;","    return sum;","}"]'::jsonb,
  null),

(6, 6, 'memory', 'java',
  'Memorize the code and answer from memory.',
  E'String msg = "CODE";\nmsg = msg.toLowerCase();\nSystem.out.println(msg.charAt(0) + "" + msg.length());',
  null, null, 'c4', null, null);

select 'Seed completed: 6 sets x 6 levels = 36 questions' as status;
