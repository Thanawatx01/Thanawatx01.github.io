class Node {
    constructor(value = null, left = null, right = null) {
        this.value = value;
        this.left = left;
        this.right = right;
    }
}

class ExpressionTree {
    prefix(node) {
        if (!node) return "";
        return `${node.value}${this.prefix(node.left)}${this.prefix(node.right)}`;
    }

    postfix(node) {
        if (!node) return "";
        return `${this.postfix(node.left)}${this.postfix(node.right)}${node.value}`;
    }

    buildFromPostfix(postfixExpression) {
        const nodeStack = [];

        for (const c of postfixExpression) {
            if (this.isOperator(c)) {
                if (nodeStack.length < 2) {
                    throw new Error("Invalid infix expression");
                }
                const right = nodeStack.pop();
                const left = nodeStack.pop();
                nodeStack.push(new Node(c, left, right));
            } else {
                nodeStack.push(new Node(c));
            }
        }

        if (nodeStack.length !== 1) {
            throw new Error("Invalid infix expression");
        }

        return nodeStack.pop();
    }

    isOperator(char) {
        return char === "+" || char === "-" || char === "*" || char === "/" || char === "^";
    }

    precedence(char) {
        if (char === "^") return 3;
        if (char === "*" || char === "/") return 2;
        if (char === "+" || char === "-") return 1;
        return 0;
    }

    infixToPostfix(infixExpression) {
        const operators = [];
        const output = [];

        for (const c of infixExpression) {
            if (c === " ") {
                continue;
            }

            if (/[A-Za-z0-9]/.test(c)) {
                output.push(c);
            } else if (c === "(") {
                operators.push(c);
            } else if (c === ")") {
                while (operators.length > 0 && operators[operators.length - 1] !== "(") {
                    output.push(operators.pop());
                }
                if (operators.length === 0) {
                    throw new Error("Mismatched parentheses");
                }
                operators.pop();
            } else if (this.isOperator(c)) {
                while (
                    operators.length > 0 &&
                    this.isOperator(operators[operators.length - 1]) &&
                    (
                        this.precedence(operators[operators.length - 1]) > this.precedence(c) ||
                        (
                            this.precedence(operators[operators.length - 1]) === this.precedence(c) &&
                            c !== "^"
                        )
                    )
                ) {
                    output.push(operators.pop());
                }
                operators.push(c);
            } else {
                throw new Error("Unsupported character");
            }
        }

        while (operators.length > 0) {
            const top = operators.pop();
            if (top === "(") {
                throw new Error("Mismatched parentheses");
            }
            output.push(top);
        }

        return output.join("");
    }
}

const buildButton = document.querySelector('[data-role="buildButton"]');
const prefixOutput = document.querySelector('[data-role="prefixOutput"]');
const postfixOutput = document.querySelector('[data-role="postfixOutput"]');
const treeOutput = document.querySelector('[data-role="treeOutput"]');
const message = document.querySelector('[data-role="message"]');

const infixInputEl = document.querySelector('[data-role="infixInput"]');

function isOperator(value) {
    return value === "+" || value === "-" || value === "*" || value === "/" || value === "^";
}

function collectLeaves(node, out) {
    if (!node.left && !node.right) {
        out.push(node);
        return;
    }
    if (node.left) collectLeaves(node.left, out);
    if (node.right) collectLeaves(node.right, out);
}

function svgEl(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function layoutTree(root) {
    const leaves = [];
    collectLeaves(root, leaves);
    if (leaves.length === 0) {
        return {
            positions: new WeakMap(),
            width: 400,
            height: 300,
            nodeRadius: 22,
            leafCount: 0
        };
    }

    const leafIndex = new WeakMap();
    leaves.forEach((leaf, i) => leafIndex.set(leaf, i));

    const rangeMap = new WeakMap();

    function computeRanges(node) {
        if (!node) return null;
        if (!node.left && !node.right) {
            const idx = leafIndex.get(node);
            const r = { min: idx, max: idx };
            rangeMap.set(node, r);
            return r;
        }

        const leftR = node.left ? computeRanges(node.left) : null;
        const rightR = node.right ? computeRanges(node.right) : null;

        const r = {
            // min comes from the left subtree, max comes from the right subtree.
            // This fixes incorrect "left/right" placement (appearing like a list).
            min: leftR ? leftR.min : rightR.min,
            max: rightR ? rightR.max : leftR.max
        };
        rangeMap.set(node, r);
        return r;
    }

    computeRanges(root);

    const positions = new WeakMap();
    let maxDepth = 0;

    const nodeRadius = 22;
    const xGap = 92;
    const levelGap = 98;
    const paddingX = 70;
    const paddingTop = 34;

    const width = Math.max(320, (leaves.length - 1) * xGap + paddingX * 2);

    function assignXY(node, depth) {
        if (!node) return;
        maxDepth = Math.max(maxDepth, depth);

        const r = rangeMap.get(node);
        const x = ((r.min + r.max) / 2) * xGap + paddingX;
        const y = depth * levelGap + paddingTop;
        positions.set(node, { x, y });

        assignXY(node.left, depth + 1);
        assignXY(node.right, depth + 1);
    }

    assignXY(root, 0);
    const height = Math.max(320, maxDepth * levelGap + paddingTop + 80);

    return { positions, width, height, nodeRadius, leafCount: leaves.length };
}

function renderTreeSVG(root) {
    treeOutput.innerHTML = "";

    const layout = layoutTree(root);
    if (layout.leafCount === 0) {
        treeOutput.textContent = "-";
        return;
    }

    const svg = svgEl("svg");
    svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.display = "block";

    const defs = svgEl("defs");
    const filter = svgEl("filter");
    filter.setAttribute("id", "dropShadow");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");
    const feDropShadow = svgEl("feDropShadow");
    feDropShadow.setAttribute("dx", "0");
    feDropShadow.setAttribute("dy", "6");
    feDropShadow.setAttribute("stdDeviation", "6");
    feDropShadow.setAttribute("flood-color", "rgba(0,0,0,0.35)");
    filter.appendChild(feDropShadow);
    defs.appendChild(filter);
    svg.appendChild(defs);

    function edgeColor(parentValue) {
        // Slightly lower opacity + softer stroke helps the tree feel less "rigid".
        return isOperator(parentValue) ? "rgba(34,211,238,0.62)" : "rgba(148,163,184,0.42)";
    }

    // Animation timings
    const nodeStaggerMs = 130;
    const nodeBaseDelayMs = 60;
    const edgeStaggerMs = 130;
    const edgeBaseDelayMs = 220;

    function drawEdges(node, depth) {
        if (!node) return;
        const p = layout.positions.get(node);

        function addEdge(child) {
            const c = layout.positions.get(child);
            const y1 = p.y + layout.nodeRadius;
            const y2 = c.y - layout.nodeRadius;
            const yMid = (y1 + y2) / 2;

            // Smooth cubic Bezier connector.
            const c1y = (y1 + yMid) / 2;
            const c2y = (y2 + yMid) / 2;
            const path = svgEl("path");
            path.setAttribute("d", `M ${p.x} ${y1} C ${p.x} ${c1y} ${c.x} ${c2y} ${c.x} ${y2}`);
            path.setAttribute("stroke", edgeColor(node.value));
            path.setAttribute("stroke-width", "2.35");
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("stroke-linejoin", "round");
            path.setAttribute("fill", "none");

            // Stroke-dash trick to animate "drawing" edges.
            // Must append to DOM before getTotalLength().
            path.style.opacity = "0";
            svg.appendChild(path);
            const len = path.getTotalLength();
            path.style.strokeDasharray = `${len}`;
            path.style.strokeDashoffset = `${len}`;
            path.style.transition =
                "stroke-dashoffset 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease";
            const delay = depth * edgeStaggerMs + edgeBaseDelayMs;
            path.style.transitionDelay = `${delay}ms`;

            // Trigger later (next frame) so transitions apply.
            requestAnimationFrame(() => {
                path.style.opacity = "1";
                path.style.strokeDashoffset = "0";
            });
        }

        if (node.left) {
            addEdge(node.left);
            drawEdges(node.left, depth + 1);
        }
        if (node.right) {
            addEdge(node.right);
            drawEdges(node.right, depth + 1);
        }
    }

    function addNodeGroup(node, depth) {
        const pos = layout.positions.get(node);
        const group = svgEl("g");
        group.style.opacity = "0";
        group.style.transformOrigin = "center";
        group.style.transformBox = "fill-box";
        group.style.transform = "scale(0.65)";

        const operator = isOperator(node.value);
        const circle = svgEl("circle");
        circle.setAttribute("cx", pos.x);
        circle.setAttribute("cy", pos.y);
        circle.setAttribute("r", layout.nodeRadius);

        const fill = operator ? "#0b1220" : "#0f172a";
        const stroke = operator ? "#22d3ee" : "#64748b";
        circle.setAttribute("fill", fill);
        circle.setAttribute("stroke", stroke);
        circle.setAttribute("stroke-width", "2.35");
        circle.setAttribute("filter", "url(#dropShadow)");
        group.appendChild(circle);

        const text = svgEl("text");
        text.setAttribute("x", pos.x);
        text.setAttribute("y", pos.y);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("font-family", "Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif");
        text.setAttribute("font-size", operator ? "18" : "19");
        text.setAttribute("font-weight", "800");
        text.setAttribute("fill", operator ? "#67e8f9" : "#e5edff");
        text.textContent = String(node.value);
        group.appendChild(text);

        svg.appendChild(group);

        group.style.transition =
            "opacity 220ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1)";
        const delay = depth * nodeStaggerMs + nodeBaseDelayMs;
        group.style.transitionDelay = `${delay}ms`;

        requestAnimationFrame(() => {
            group.style.opacity = "1";
            group.style.transform = "scale(1)";
        });
    }

    function drawNodes(node, depth) {
        if (!node) return;
        addNodeGroup(node, depth);
        drawNodes(node.left, depth + 1);
        drawNodes(node.right, depth + 1);
    }

    drawEdges(root, 0);
    drawNodes(root, 0);
    treeOutput.appendChild(svg);
}

function renderTraversal() {
    let rawInput = infixInputEl.value || "";
    rawInput = rawInput
        .replace(/[–—−]/g, "-")
        .replace(/×/g, "*")
        .replace(/÷/g, "/");

    const expression = rawInput.replace(/\s+/g, "");

    if (!expression) {
        message.textContent = "Please enter an infix expression.";
        prefixOutput.textContent = "-";
        postfixOutput.textContent = "-";
        treeOutput.textContent = "-";
        return;
    }

    try {
        const tree = new ExpressionTree();
        const postfixExpr = tree.infixToPostfix(expression);
        const root = tree.buildFromPostfix(postfixExpr);

        prefixOutput.textContent = tree.prefix(root);
        postfixOutput.textContent = tree.postfix(root);
        renderTreeSVG(root);
        message.textContent = "";
    } catch (_error) {
        message.textContent = "Invalid infix expression. Please check input.";
        prefixOutput.textContent = "-";
        postfixOutput.textContent = "-";
        treeOutput.textContent = "-";
    }
}

buildButton.addEventListener("click", renderTraversal);
infixInputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        renderTraversal();
    }
});

renderTraversal();