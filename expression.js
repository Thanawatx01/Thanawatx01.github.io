
let expression = "A+(B*C)";

function Precedence(Op) {
  if (Op == "+" || Op == "-") return 1;
  if (Op == "*" || Op == "/") return 2;
  if (Op == "**") return 3;
  return 0;
}

function isRightAssociative(Op) {
  return Op === "**";
}

function infixToPostfix(exp) {
  let Stack = [];
  let Postfix = [];
  for (let index = 0; index < exp.length; index++) {
    let char = exp.charAt(index);
    if (char === " ") continue;
    if (char === "*" && exp.charAt(index + 1) === "*") {
      char = "**";
      index++;
    }
    if (char.match(/[A-Za-z0-9]/)) {
      Postfix.push(char);
    } else if (char == "(") {
      Stack.push(char);
    } else if (char == ")") {
      while (Stack.length && Stack[Stack.length - 1] !== "(") {
        Postfix.push(Stack.pop());
      }
      Stack.pop();
    } else {
      let prec = Precedence(char);
      let rightAssoc = isRightAssociative(char);
      while (Stack.length && Stack[Stack.length - 1] !== "(") {
        let top = Stack[Stack.length - 1];
        let topPrec = Precedence(top);
        if (rightAssoc ? topPrec > prec : topPrec >= prec) {
          Postfix.push(Stack.pop());
        } else break;
      }
      Stack.push(char);
    }
  }
  while (Stack.length) {
    Postfix.push(Stack.pop());
  }
  return Postfix;
}

function isOperator(c) {
  return c === "+" || c === "-" || c === "*" || c === "/" || c === "**";
}

function prefixToPostfix(prefixStr) {
  const stack = [];
  const expr = prefixStr.replace(/\s+/g, "").trim();
  if (!expr) return "";

  for (let i = expr.length - 1; i >= 0; i--) {
    let char = expr[i];
    if (char === "*" && i > 0 && expr[i - 1] === "*") {
      char = "**";
      i--;
    }
    if (char.match(/[A-Za-z0-9]/)) {
      stack.push(char);
    } else if (isOperator(char)) {
      if (stack.length < 2) return "Invalid prefix expression";
      const op1 = stack.pop();
      const op2 = stack.pop();
      stack.push(op1 + op2 + char);
    }
  }
  if (stack.length !== 1) return "Invalid prefix expression";
  return stack.pop();
}
