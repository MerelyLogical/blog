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
            "game1": {
                title: "🚧 Game 1",
                items: {
                    "game1_1": { title: "🚧 Game 1 - Test" },
                }
            },
            "game2": {
                title: "🚧 Game 2",
                items: {
                    "game2_1": { title: "🚧 Game 2 - Test" },
                }
            }
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
