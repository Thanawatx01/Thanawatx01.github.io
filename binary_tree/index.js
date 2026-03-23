class BSTNode {
  constructor(key, id) {
    this.key = key;
    this.left = null;
    this.right = null;
    this.id = id;
  }
}

class BST {
  constructor() {
    this.root = null;
    this._nextId = 1;
  }

  _newNode(key) {
    return new BSTNode(key, this._nextId++);
  }

  isEmpty() {
    return this.root === null;
  }

  search(key) {
    const visited = [];
    let curr = this.root;
    while (curr) {
      visited.push(curr);
      if (key === curr.key) return { found: true, visited };
      curr = key < curr.key ? curr.left : curr.right;
    }
    return { found: false, visited };
  }

  insert(key) {
    if (!this.root) {
      this.root = this._newNode(key);
      return { inserted: true, insertedNode: this.root, visited: [] };
    }

    let curr = this.root;
    const visited = [];
    while (curr) {
      visited.push(curr);
      if (key === curr.key) return { inserted: false, insertedNode: curr, visited };
      if (key < curr.key) {
        if (!curr.left) {
          curr.left = this._newNode(key);
          return { inserted: true, insertedNode: curr.left, visited };
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          curr.right = this._newNode(key);
          return { inserted: true, insertedNode: curr.right, visited };
        }
        curr = curr.right;
      }
    }

    return { inserted: false, insertedNode: null, visited };
  }

  delete(key) {
    // Returns { deleted: boolean, visited: BSTNode[], deletedKey: number }
    if (!this.root) return { deleted: false, visited: [], deletedKey: key };

    const visited = [];
    let parent = null;
    let curr = this.root;

    while (curr && curr.key !== key) {
      visited.push(curr);
      parent = curr;
      curr = key < curr.key ? curr.left : curr.right;
    }

    if (!curr) return { deleted: false, visited, deletedKey: key };

    visited.push(curr);

    // Case 1 & 2: node has at most one child
    if (!curr.left || !curr.right) {
      const child = curr.left ? curr.left : curr.right; // may be null
      if (!parent) {
        this.root = child;
      } else if (parent.left === curr) {
        parent.left = child;
      } else {
        parent.right = child;
      }
      return { deleted: true, visited, deletedKey: key };
    }

    // Case 3: node has two children -> swap with successor (min in right subtree)
    let succParent = curr;
    let succ = curr.right;
    // succ path nodes (including succ)
    while (succ.left) {
      visited.push(succ);
      succParent = succ;
      succ = succ.left;
    }
    visited.push(succ);

    // Swap keys only (ids stay -> nicer animations)
    curr.key = succ.key;

    // Delete successor node from the right subtree
    if (succParent.left === succ) {
      succParent.left = succ.right;
    } else {
      // succ is curr.right's chain's min => succParent is curr or its descendants
      succParent.right = succ.right;
    }

    return { deleted: true, visited, deletedKey: key };
  }

  // Traversals return arrays of nodes in order
  inOrder() {
    const out = [];
    const dfs = (n) => {
      if (!n) return;
      dfs(n.left);
      out.push(n);
      dfs(n.right);
    };
    dfs(this.root);
    return out;
  }

  preOrder() {
    const out = [];
    const dfs = (n) => {
      if (!n) return;
      out.push(n);
      dfs(n.left);
      dfs(n.right);
    };
    dfs(this.root);
    return out;
  }

  postOrder() {
    const out = [];
    const dfs = (n) => {
      if (!n) return;
      dfs(n.left);
      dfs(n.right);
      out.push(n);
    };
    dfs(this.root);
    return out;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseNumberList(input) {
  const raw = (input || "").trim();
  if (!raw) return [];
  const tokens = raw.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
  const nums = [];
  for (const t of tokens) {
    const n = Number(t);
    if (!Number.isFinite(n)) throw new Error(`Invalid number: "${t}"`);
    nums.push(n);
  }
  return nums;
}

function svgEl(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

class BSTVisualizer {
  constructor() {
    this.bst = new BST();
    this.isBusy = false;

    this.treeOutput = document.querySelector('[data-role="treeOutput"]');
    this.messageEl = document.querySelector('[data-role="message"]');
    this.traversalOutput = document.querySelector('[data-role="traversalOutput"]');
    this.logOutput = document.querySelector('[data-role="logOutput"]');

    this.buildInput = document.querySelector('[data-role="buildInput"]');
    this.searchInput = document.querySelector('[data-role="searchInput"]');
    this.addInput = document.querySelector('[data-role="addInput"]');
    this.deleteInput = document.querySelector('[data-role="deleteInput"]');

    this.buildButton = document.querySelector('[data-role="buildButton"]');
    this.resetButton = document.querySelector('[data-role="resetButton"]');
    this.searchButton = document.querySelector('[data-role="searchButton"]');
    this.addButton = document.querySelector('[data-role="addButton"]');
    this.deleteButton = document.querySelector('[data-role="deleteButton"]');

    this.inOrderButton = document.querySelector('[data-role="inOrderButton"]');
    this.preOrderButton = document.querySelector('[data-role="preOrderButton"]');
    this.postOrderButton = document.querySelector('[data-role="postOrderButton"]');

    this.nodeById = new Map(); // id -> { circle, group }
    this._defaultNodeStyle = new Map(); // id -> { fill, stroke }
  }

  _clearLog() {
    if (!this.logOutput) return;
    this.logOutput.textContent = "";
  }

  _appendLog(line) {
    if (!this.logOutput) return;
    this.logOutput.textContent += `${line}\n`;
    this.logOutput.scrollTop = this.logOutput.scrollHeight;
  }

  setBusy(v) {
    this.isBusy = v;
    const disable = (el) => {
      if (!el) return;
      el.disabled = v;
    };

    [
      this.buildButton,
      this.resetButton,
      this.searchButton,
      this.addButton,
      this.deleteButton,
      this.inOrderButton,
      this.preOrderButton,
      this.postOrderButton,
      this.buildInput,
      this.searchInput,
      this.addInput,
      this.deleteInput
    ].forEach(disable);
  }

  // Layout: assign x by in-order index, y by depth
  layoutTree() {
    const positions = new Map(); // id -> {x,y}
    const nodes = [];

    let idx = 0;
    let maxDepth = 0;

    const xGap = 92;
    const levelGap = 110;
    const paddingX = 70;
    const paddingTop = 40;

    const inorder = (n, depth) => {
      if (!n) return;
      maxDepth = Math.max(maxDepth, depth);
      inorder(n.left, depth + 1);
      positions.set(n.id, { x: idx * xGap + paddingX, y: depth * levelGap + paddingTop });
      nodes.push(n);
      idx++;
      inorder(n.right, depth + 1);
    };

    inorder(this.bst.root, 0);

    const width = Math.max(320, (idx - 1) * xGap + paddingX * 2);
    const height = Math.max(320, maxDepth * levelGap + paddingTop + 120);
    return { positions, width, height, xGap, levelGap, paddingX, paddingTop, nodeCount: idx, maxDepth };
  }

  renderTree(animate = true) {
    this.treeOutput.innerHTML = "";
    this.nodeById.clear();
    this._defaultNodeStyle.clear();

    if (this.bst.isEmpty()) {
      this.treeOutput.textContent = "-";
      return;
    }

    const layout = this.layoutTree();
    const nodeRadius = Math.max(22, Math.min(28, Math.floor(layout.xGap / 4)));

    const svg = svgEl("svg");
    svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const defs = svgEl("defs");
    const filter = svgEl("filter");
    filter.setAttribute("id", "bstShadow");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");
    const feDropShadow = svgEl("feDropShadow");
    feDropShadow.setAttribute("dx", "0");
    feDropShadow.setAttribute("dy", "8");
    feDropShadow.setAttribute("stdDeviation", "6");
    feDropShadow.setAttribute("flood-color", "rgba(0,0,0,0.35)");
    filter.appendChild(feDropShadow);
    defs.appendChild(filter);
    svg.appendChild(defs);

    const edgeColor = "rgba(148,163,184,0.55)";
    const isActiveColor = "rgba(34,211,238,0.80)";

    const drawEdges = (node) => {
      if (!node) return;
      const p = layout.positions.get(node.id);

      const drawOneEdge = (child) => {
        const c = layout.positions.get(child.id);
        const y1 = p.y + nodeRadius;
        const y2 = c.y - nodeRadius;
        const yMid = (y1 + y2) / 2;

        const c1y = (y1 + yMid) / 2;
        const c2y = (y2 + yMid) / 2;

        const path = svgEl("path");
        path.setAttribute("d", `M ${p.x} ${y1} C ${p.x} ${c1y} ${c.x} ${c2y} ${c.x} ${y2}`);
        path.setAttribute("stroke", edgeColor);
        path.setAttribute("stroke-width", "2.25");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("fill", "none");

        if (animate) {
          path.style.opacity = "0";
          svg.appendChild(path);
          const len = path.getTotalLength();
          path.style.strokeDasharray = `${len}`;
          path.style.strokeDashoffset = `${len}`;
          path.style.transition =
            "stroke-dashoffset 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease";
          requestAnimationFrame(() => {
            path.style.opacity = "1";
            path.style.strokeDashoffset = "0";
          });
        } else {
          svg.appendChild(path);
        }
      };

      if (node.left) {
        drawOneEdge(node.left);
        drawEdges(node.left);
      }
      if (node.right) {
        drawOneEdge(node.right);
        drawEdges(node.right);
      }
    };

    drawEdges(this.bst.root);

    const drawNodes = (node, depth) => {
      if (!node) return;
      const pos = layout.positions.get(node.id);

      const group = svgEl("g");
      group.setAttribute("data-node-id", String(node.id));
      group.style.opacity = animate ? "0" : "1";
      group.style.transformOrigin = `${pos.x}px ${pos.y}px`;
      group.style.transformBox = "fill-box";
      group.style.transform = animate ? "scale(0.65)" : "scale(1)";

      const circle = svgEl("circle");
      circle.setAttribute("cx", pos.x);
      circle.setAttribute("cy", pos.y);
      circle.setAttribute("r", nodeRadius);
      circle.setAttribute("fill", "#0f172a");
      circle.setAttribute("stroke", "#64748b");
      circle.setAttribute("stroke-width", "2.25");
      circle.setAttribute("filter", "url(#bstShadow)");

      const text = svgEl("text");
      text.setAttribute("x", pos.x);
      text.setAttribute("y", pos.y);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("font-family", "Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif");
      text.setAttribute("font-size", "19");
      text.setAttribute("font-weight", "800");
      text.setAttribute("fill", "#e5edff");
      text.textContent = String(node.key);

      group.appendChild(circle);
      group.appendChild(text);
      svg.appendChild(group);

      this.nodeById.set(node.id, { circle, group });
      this._defaultNodeStyle.set(node.id, { fill: "#0f172a", stroke: "#64748b", textFill: "#e5edff" });

      if (animate) {
        const delay = depth * 90 + 60;
        group.style.transition = "opacity 240ms ease, transform 300ms cubic-bezier(0.22, 1, 0.36, 1)";
        group.style.transitionDelay = `${delay}ms`;
        requestAnimationFrame(() => {
          group.style.opacity = "1";
          group.style.transform = "scale(1)";
        });
      }

      drawNodes(node.left, depth + 1);
      drawNodes(node.right, depth + 1);
    };

    drawNodes(this.bst.root, 0);

    this.treeOutput.appendChild(svg);
    this._edgeActiveColor = isActiveColor;
  }

  _setNodeHighlight(nodeId, mode) {
    const item = this.nodeById.get(nodeId);
    if (!item) return;
    const { circle } = item;

    if (mode === "default") {
      const d = this._defaultNodeStyle.get(nodeId);
      circle.setAttribute("fill", d.fill);
      circle.setAttribute("stroke", d.stroke);
      return;
    }
    if (mode === "visited") {
      circle.setAttribute("stroke", "#38bdf8");
      circle.setAttribute("fill", "rgba(56,189,248,0.15)");
      return;
    }
    if (mode === "found") {
      circle.setAttribute("stroke", "#22c55e");
      circle.setAttribute("fill", "rgba(34,197,94,0.18)");
      return;
    }
    if (mode === "not_found") {
      circle.setAttribute("stroke", "#fb7185");
      circle.setAttribute("fill", "rgba(251,113,133,0.18)");
      return;
    }
  }

  _clearHighlights() {
    for (const id of this.nodeById.keys()) this._setNodeHighlight(id, "default");
  }

  async animatePath(pathNodes, finalMode, onStep) {
    // pathNodes: array of BSTNode
    this._clearHighlights();

    for (let i = 0; i < pathNodes.length; i++) {
      const n = pathNodes[i];
      if (typeof onStep === "function") onStep(n, i, pathNodes.length);
      this._setNodeHighlight(n.id, "visited");
      await sleep(220);
    }

    if (pathNodes.length > 0) {
      const last = pathNodes[pathNodes.length - 1];
      if (finalMode) this._setNodeHighlight(last.id, finalMode);
      await sleep(420);
    }

    // Keep the last state briefly; then clear
    this._clearHighlights();
  }

  async animateTraversal(orderNodes, labelName) {
    if (orderNodes.length === 0) {
      this.traversalOutput.textContent = "-";
      this.messageEl.textContent = "Tree is empty.";
      return;
    }

    this._clearHighlights();
    this.traversalOutput.textContent = "";
    this.messageEl.textContent = "";

    let out = [];
    for (let i = 0; i < orderNodes.length; i++) {
      const n = orderNodes[i];
      this._setNodeHighlight(n.id, "visited");
      out.push(n.key);

      this.traversalOutput.textContent = out.join("  →  ");
      await sleep(280);

      this._setNodeHighlight(n.id, "default");
      await sleep(60);
    }

    this.messageEl.textContent = `${labelName} finished.`;
    await sleep(420);
  }

  async buildAnimated() {
    let nums;
    try {
      nums = parseNumberList(this.buildInput.value);
    } catch (e) {
      this.messageEl.textContent = e.message;
      return;
    }

    this.setBusy(true);
    this.messageEl.textContent = "Building...";
    // reset tree but keep visual clean
    this.bst = new BST();
    this.renderTree(false);

    try {
      for (const key of nums) {
        // For animation: highlight comparisons path
        if (!this.bst.root) {
          this.bst.insert(key);
          this.renderTree(true);
          await sleep(420);
          continue;
        }

        // Simulate path by search before insert so we animate the route.
        const { visited } = this.bst.search(key);
        await this.animatePath(visited, null);
        const res = this.bst.insert(key);
        if (!res.inserted) {
          this.messageEl.textContent = `${key} already exists (skip).`;
          await sleep(500);
        } else {
          this.messageEl.textContent = `Added ${key}`;
          this.renderTree(true);
          await sleep(520);
        }
      }
    } finally {
      this.setBusy(false);
    }

    this.messageEl.textContent = "Build complete.";
    await sleep(420);
  }

  async searchAnimated() {
    let nums;
    try {
      nums = parseNumberList(this.searchInput.value);
    } catch (e) {
      this.messageEl.textContent = e.message;
      return;
    }

    if (this.bst.isEmpty()) {
      this.messageEl.textContent = "Tree is empty. Build first.";
      return;
    }

    this.setBusy(true);
    this.messageEl.textContent = "Searching...";
    this._clearLog();
    this._appendLog(`Search keys: ${nums.join(", ")}`);

    try {
      for (const key of nums) {
        const { found, visited } = this.bst.search(key);
        this.messageEl.textContent = found ? `Found ${key}` : `Not found: ${key}`;
        this._appendLog(`\nKey = ${key}`);
        await this.animatePath(visited, found ? "found" : "not_found", (n, i, total) => {
          this._appendLog(`  step ${i + 1}/${total}: compare at node ${n.key}`);
        });
        this._appendLog(`  Result: ${found ? "FOUND" : "NOT FOUND"}`);
      }
    } finally {
      this.setBusy(false);
    }

    this.messageEl.textContent = "Search done.";
    await sleep(300);
  }

  async addAnimated() {
    let nums;
    try {
      nums = parseNumberList(this.addInput.value);
    } catch (e) {
      this.messageEl.textContent = e.message;
      return;
    }

    if (nums.length === 0) return;
    this.setBusy(true);
    this.messageEl.textContent = "Adding...";

    try {
      for (const key of nums) {
        if (this.bst.isEmpty()) {
          this.bst.insert(key);
          this.renderTree(true);
          this.messageEl.textContent = `Added ${key}`;
          await sleep(560);
          continue;
        }

        const { visited } = this.bst.search(key);
        await this.animatePath(visited, null);
        const res = this.bst.insert(key);
        if (!res.inserted) {
          this.messageEl.textContent = `${key} already exists (skip).`;
          await sleep(520);
        } else {
          this.messageEl.textContent = `Added ${key}`;
          this.renderTree(true);
          await sleep(560);
        }
      }
    } finally {
      this.setBusy(false);
    }

    this.messageEl.textContent = "Add done.";
    await sleep(300);
  }

  async deleteAnimated() {
    let nums;
    try {
      nums = parseNumberList(this.deleteInput.value);
    } catch (e) {
      this.messageEl.textContent = e.message;
      return;
    }

    if (nums.length === 0) return;
    if (this.bst.isEmpty()) {
      this.messageEl.textContent = "Tree is empty. Build first.";
      return;
    }

    this.setBusy(true);
    this.messageEl.textContent = "Deleting...";

    try {
      for (const key of nums) {
        const { visited, deleted } = (() => {
          // search path for animation first:
          const s = this.bst.search(key);
          if (!s.found) return { visited: s.visited, deleted: false };
          // then compute deletion visited from actual delete
          const d = this.bst.delete(key);
          return { visited: d.visited, deleted: d.deleted };
        })();

        if (!deleted) {
          this.messageEl.textContent = `Not found: ${key}`;
          await this.animatePath(visited, "not_found");
          continue;
        }

        this.messageEl.textContent = `Deleted ${key}`;
        await this.animatePath(visited, null);
        this.renderTree(true);
        await sleep(620);
      }
    } finally {
      this.setBusy(false);
    }

    this.messageEl.textContent = "Delete done.";
    await sleep(300);
  }

  async startTraversal(type) {
    if (this.bst.isEmpty()) {
      this.messageEl.textContent = "Tree is empty. Build first.";
      return;
    }
    const order =
      type === "in"
        ? this.bst.inOrder()
        : type === "pre"
          ? this.bst.preOrder()
          : this.bst.postOrder();

    this.setBusy(true);
    try {
      this.renderTree(false); // keep current nodes, but ensure SVG is ready
      await this.animateTraversal(order, type === "in" ? "In-order" : type === "pre" ? "Pre-order" : "Post-order");
    } finally {
      this.setBusy(false);
    }
  }
}

const vis = new BSTVisualizer();

vis.buildButton.addEventListener("click", () => vis.buildAnimated());
vis.resetButton.addEventListener("click", async () => {
  vis.setBusy(true);
  try {
    vis.bst = new BST();
    vis.messageEl.textContent = "";
    vis.traversalOutput.textContent = "-";
    vis.renderTree(false);
  } finally {
    vis.setBusy(false);
  }
});
vis.searchButton.addEventListener("click", () => vis.searchAnimated());
vis.addButton.addEventListener("click", () => vis.addAnimated());
vis.deleteButton.addEventListener("click", () => vis.deleteAnimated());
vis.inOrderButton.addEventListener("click", () => vis.startTraversal("in"));
vis.preOrderButton.addEventListener("click", () => vis.startTraversal("pre"));
vis.postOrderButton.addEventListener("click", () => vis.startTraversal("post"));

// Initial render
vis.renderTree(false);

