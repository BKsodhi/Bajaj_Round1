const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/bfhl', (req, res) => {
    const { data } = req.body;
    if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: "Invalid input" });
    }

    const validEdges = [];
    const invalid_entries = [];
    const duplicate_edges = [];
    const seenEdges = new Set();
    const allNodes = new Set();
    const childSet = new Set();

    data.forEach(item => {
        const trimmed = item.trim();
        const match = /^([A-Z])->([A-Z])$/.exec(trimmed);
        
        if (!match || match[1] === match[2]) {
            invalid_entries.push(item);
        } else {
            const edge = `${match[1]}->${match[2]}`;
            if (seenEdges.has(edge)) {
                if (!duplicate_edges.includes(edge)) duplicate_edges.push(edge);
            } else {
                seenEdges.add(edge);
                validEdges.push({ parent: match[1], child: match[2] });
                allNodes.add(match[1]);
                allNodes.add(match[2]);
                childSet.add(match[2]);
            }
        }
    });

    const adj = {};
    validEdges.forEach(({ parent, child }) => {
        if (!adj[parent]) adj[parent] = [];
        adj[parent].push(child);
    });

    function buildTree(node, visited = new Set()) {
        if (visited.has(node)) return { cycle: true };
        visited.add(node);
        const children = adj[node] || [];
        const tree = {};
        let maxChildDepth = 0;

        for (const child of children) {
            const result = buildTree(child, new Set(visited));
            if (result.cycle) return { cycle: true };
            tree[child] = result.tree;
            maxChildDepth = Math.max(maxChildDepth, result.depth);
        }
        return { tree, depth: 1 + maxChildDepth };
    }

    const roots = [...allNodes].filter(node => !childSet.has(node));
    const hierarchies = roots.map(root => {
        const result = buildTree(root);
        if (result.cycle) return { root, tree: {}, has_cycle: true };
        return { root, tree: { [root]: result.tree }, depth: result.depth };
    });

    const nodesInEdges = new Set([...allNodes]);
    const processedNodes = new Set();
    hierarchies.forEach(h => {
        function mark(obj) {
            if (!obj) return;
            for (let key in obj) {
                processedNodes.add(key);
                mark(obj[key]);
            }
        }
        mark(h.tree);
    });

    const remaining = [...nodesInEdges].filter(n => !processedNodes.has(n));

    if (remaining.length > 0) {
        remaining.sort();
        hierarchies.push({
            root: remaining[0],
            tree: {},
            has_cycle: true
        });
    }

    const total_trees = hierarchies.filter(h => !h.has_cycle).length;
    const total_cycles = hierarchies.filter(h => h.has_cycle).length;
    
    let largest_tree_root = "";
    let maxDepth = -1;
    hierarchies.filter(h => !h.has_cycle).forEach(h => {
        if (h.depth > maxDepth || (h.depth === maxDepth && (largest_tree_root === "" || h.root < largest_tree_root))) {
            maxDepth = h.depth;
            largest_tree_root = h.root;
        }
    });

    res.json({
        user_id: "Bhavnoorkaur_29042005",
        email_id: "bhavnoor1637.be23@chitkara.edu.in",
        college_roll_number: "2310991637",
        hierarchies,
        invalid_entries,
        duplicate_edges,
        summary: { total_trees, total_cycles, largest_tree_root }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));