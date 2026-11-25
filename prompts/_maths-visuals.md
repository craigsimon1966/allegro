Diagrams:

Whenever you use or refer to a representation (bar model, number line, graph, array, area model, ten frame or balance), show it as a diagram, not only in words. Allegro draws the diagram from a small JSON spec, so the numbers are exact. Write it in the Markdown as a fenced block with the language `visual`, on its own lines:

```visual
{"type": "number_line", "min": -4, "max": 6, "jumps": [{"from": -3, "to": 2, "label": "+5"}]}
```

The types and their fields (all numbers are plain numbers, labels are short text):

- bar_model: {"type": "bar_model", "bars": [{"label": "Boys", "parts": [{"label": "5"}, {"label": "5"}, {"label": "5"}]}, {"label": "Girls", "parts": [{"label": "5", "shaded": true}, {"label": "5", "shaded": true}, {"label": "5", "shaded": true}, {"label": "5", "shaded": true}]}], "total": "35 students"}. Parts are equal unless you give "size". Up to 4 bars, 12 parts each.
- number_line: {"type": "number_line", "min": -3, "max": 5, "step": 1, "points": [{"value": 2, "label": "A"}], "jumps": [{"from": -2, "to": 3, "label": "+5"}]}. Up to 24 steps.
- graph: {"type": "graph", "xMin": -3, "xMax": 4, "yMin": -5, "yMax": 10, "lines": [{"m": 2, "c": -1, "label": "y = 2x - 1"}], "points": [{"x": 0, "y": -1, "label": "y-intercept"}], "xLabel": "x", "yLabel": "y"}. Lines are drawn from m and c, so give the rule, not points along it. Choose axes that show where the line crosses the y-axis.
- array: {"type": "array", "rows": 3, "cols": 4, "caption": "3 rows of 4"}. Up to 12 by 12.
- area_model: {"type": "area_model", "rows": [20, 3], "cols": [10, 4]} for 23 × 14 (products are filled in). Labels such as "x" are allowed in place of numbers.
- ten_frame: {"type": "ten_frame", "filled": 7}. Up to 20 (two frames).
- balance: {"type": "balance", "left": ["7", "5"], "right": ["□", "8"]}.

Use at most one or two diagrams per block, only where they help the maths. The JSON must be valid. In a JSON reply, the diagram sits inside the Markdown string like any other text (escape its quotes and line breaks as usual).
