import FlagTitle from '../ts/components/FlagTitle'

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
            title: <FlagTitle image="Flag_HUN_Anjou.png" label="Hungary" />,
            items: {
              "EU5_H_1": { title: "1 - Start!" }
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
  "garden": {
    title: "Garden",
    items: {
      "families": { title: "Families" },
      "log": { title: "Log" },
    },
  },
  '--': {
    type: "separator",
  },
  "playground": {
    title: "Playground",
    // type: "page",
    // theme: {
    //   pagination: false // Hide pagination on this page
    // },
    items: {
      "--maths":   { type: "separator", title: "Maths & Time" },
      "clocks":    { title: "Clocks" },
      "moment":    { title: "A Moment of Time" },
      "picalc":    { title: "π Calculator" },
      "ecalc":     { title: "e Calculator" },
      "--maps":    { type: "separator", title: "Maps & Grids" },
      "hex":       { title: "Hexagonal Grid" },
      "hex2":      { title: "Hexagonal Grid Pathfinding" },
      "mapgen":    { title: "Random Map Pathfinding" },
      "terrain":   { title: "Hex Terrain Generation" },
      "--sims":    { type: "separator", title: "Simulations" },
      "physics":   { title: "Physics Engine" },
      "marketsim": { title: "Stock Market Simulator" },
      "aifight":   { title: "AI Arena" },
      "buyvsrent": { title: "Buy vs Rent Calculator"},
      "lift":      { title: "Lift Simulator" },
      "--lang":    { type: "separator", title: "Language & Music" },
      "dakuten":   { title: "Dakuten" },
      "aruaru":    { title: "Aruaru Quiz" },
      "pinyin":    { title: "Pinyin Chart" },
      "fretboard": { title: "Fretboard" },
      "formants":  { title: "Vowel Synth" },
    }
  },
  // A link rather than a page tab, so the page keeps the shared sidebar.
  "whats-new-tab": {
    title: "What's New",
    type: "page",
    href: "/whats-new",
  },
  "whats-new": {
    title: "What's New",
    display: 'hidden'
  },
  "not-found": {
    title: "404",
    display: 'hidden'
  }
}
