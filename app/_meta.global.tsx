export default {
  "*": {
    theme: {
      timestamp: false
    }
  },
  "index": {
    title: "Home"
  },
  "letsplay": {
    title: "🚧 Let's Play",
    items: {
      "EU5": {
        title: "⏳ Europa Universalis V",
        items: {
          "Hungary": {
            title: "🇭🇺 Hungary" ,
            items: {
              "EU5_H_1": { title: "Chapter 1 — Start!" }
            },
          },
        },
      },
    },
  },
  "nas": {
    title: "NAS Build Log",
    items: {
      "nas0": { title: "0 - Building a Server"},
      "nas1": { title: "1 - Building a NAS" },
      "nas2": { title: "2 - Improving the NAS" },
      "nas3": { title: "3 - Upgrading the NAS" },
    },
  },
  '--': {
    type: "separator",
  },
  "playground": {
    title: "Playground",
    type: "page",
    theme: {
      pagination: false // Hide pagination on this page
    },
    items: {
      "clocks":    { title: "Clocks" },
      "dakuten":   { title: "Dakuten" },
      "aruaru":    { title: "Aruaru Quiz" },
      "hex":       { title: "Hexagonal Grid" },
      "hex2":      { title: "Hexagonal Grid Pathfinding" },
      "mapgen":    { title: "Random Map Pathfinding" },
      "physics":   { title: "Physics Engine" },
      "marketsim": { title: "Stock Market Simulator" },
      "moment":    { title: "A Moment of Time" },
      "picalc":    { title: "π Calculator" },
      "ecalc":     { title: "e Calculator" },
      "pinyin":    { title: "Pinyin Chart" },
    }
  },
  "not-found": {
    title: "404",
    display: 'hidden'
  }
}
