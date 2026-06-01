// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — islands.js
//  Island definitions and navigation logic.
// ═══════════════════════════════════════════════════════════════════════════

export const ISLANDS = [
  {
    "name": "G-1",
    "x": 4.4,
    "y": 45.2,
    "id": "g_1",
    "type": "MARINE",
    "description": "A major Marine base in the New World.",
    "modifiers": { "eventDifficulty": 1.5, "goldMultiplier": 1.2 },
    "icon": "⚓"
  },
  {
    "name": "G-5",
    "x": 4.3,
    "y": 55.2,
    "id": "g_5",
    "type": "MARINE",
    "description": "A rogue Marine branch in the New World.",
    "modifiers": { "eventDifficulty": 1.8, "goldMultiplier": 1.5 },
    "icon": "⚓"
  },
  {
    "name": "Punk Hazard",
    "x": 6.4,
    "y": 54.5,
    "id": "punk_hazard",
    "type": "DANGER",
    "description": "An island split between burning heat and freezing cold.",
    "modifiers": { "eventDifficulty": 2.0, "fruitDropChanceMult": 1.5 },
    "icon": "🔥❄️"
  },
  {
    "name": "Raijin Island",
    "x": 7.1,
    "y": 51.9,
    "id": "raijin_island",
    "type": "DANGER",
    "description": "An island where lightning rains down constantly.",
    "modifiers": { "eventDifficulty": 1.5, "repairCost": 1.5 },
    "icon": "⚡"
  },
  {
    "name": "Risky Red Island",
    "x": 7.7,
    "y": 49.2,
    "id": "risky_red_island",
    "type": "MYSTERY",
    "description": "A strange island with red soil and unknown dangers.",
    "modifiers": { "fruitDropChanceMult": 1.2 },
    "icon": "❓"
  },
  {
    "name": "Mystoria Island",
    "x": 7.2,
    "y": 46.6,
    "id": "mystoria_island",
    "type": "MYSTERY",
    "description": "An island shrouded in myth and fog.",
    "modifiers": { "goldMultiplier": 0.8, "fruitDropChanceMult": 1.8 },
    "icon": "🌫️"
  },
  {
    "name": "Coastal Ruins",
    "x": 10.1,
    "y": 47,
    "id": "coastal_ruins",
    "type": "SAFE",
    "description": "Ancient ruins by the sea. Quiet and safe for now.",
    "modifiers": { "tavernCost": 0.5 },
    "icon": "🏛️"
  },
  {
    "name": "Porco Kingdom",
    "x": 9.9,
    "y": 43.7,
    "id": "porco_kingdom",
    "type": "TRADE",
    "description": "A kingdom known for its peculiar agriculture.",
    "modifiers": { "marketDiscount": 0.8 },
    "icon": "👑"
  },
  {
    "name": "Majiatsuka Kingdom",
    "x": 9.4,
    "y": 56.2,
    "id": "majiatsuka_kingdom",
    "type": "TRADE",
    "description": "A wealthy kingdom dealing in rare goods.",
    "modifiers": { "goldMultiplier": 1.5, "tavernCost": 1.5 },
    "icon": "💰"
  },
  {
    "name": "Port Chibaralta Island",
    "x": 11.4,
    "y": 49.8,
    "id": "port_chibaralta_island",
    "type": "TRADE",
    "description": "A bustling port town, ideal for resupplying.",
    "modifiers": { "repairCost": 0.8 },
    "icon": "🚢"
  },
  {
    "name": "Mogaro Kingdom",
    "x": 12,
    "y": 45.8,
    "id": "mogaro_kingdom",
    "type": "TRADE",
    "description": "A kingdom built on deep ravines.",
    "modifiers": { "goldMultiplier": 1.2 },
    "icon": "🏰"
  },
  {
    "name": "Standing Kingdom",
    "x": 13,
    "y": 43.3,
    "id": "standing_kingdom",
    "type": "TRADE",
    "description": "A proud kingdom with a strong military presence.",
    "modifiers": { "eventDifficulty": 1.2, "recruitSuccess": 1.2 },
    "icon": "⚔️"
  },
  {
    "name": "Gartel Island",
    "x": 14.7,
    "y": 46.3,
    "id": "gartel_island",
    "type": "SAFE",
    "description": "A peaceful island with gentle winds.",
    "modifiers": { "tavernCost": 0.8 },
    "icon": "🍃"
  },
  {
    "name": "Dressrosa Kingdom",
    "x": 15.1,
    "y": 51.8,
    "id": "dressrosa_kingdom",
    "type": "TRADE",
    "description": "The country of love, passion, and toys.",
    "modifiers": { "goldMultiplier": 1.5, "eventDifficulty": 1.5 },
    "icon": "💃"
  },
  {
    "name": "Prodence Kingdom",
    "x": 13.6,
    "y": 55.5,
    "id": "prodence_kingdom",
    "type": "TRADE",
    "description": "A neighboring kingdom to Dressrosa, known for its fighting king.",
    "modifiers": { "recruitSuccess": 1.3 },
    "icon": "🥊"
  },
  {
    "name": "Broc Coli Island",
    "x": 16.6,
    "y": 43.6,
    "id": "broc_coli_island",
    "type": "MYSTERY",
    "description": "An island with trees that look like giant broccoli.",
    "modifiers": { "fruitDropChanceMult": 1.1 },
    "icon": "🥦"
  },
  {
    "name": "Applenine Island",
    "x": 17.4,
    "y": 49.4,
    "id": "applenine_island",
    "type": "SAFE",
    "description": "Famous for its vast apple orchards.",
    "modifiers": { "tavernCost": 0.7 },
    "icon": "🍎"
  },
  {
    "name": "Yukiryu Island",
    "x": 18,
    "y": 57.3,
    "id": "yukiryu_island",
    "type": "DANGER",
    "description": "A snowy island where a dragon is said to sleep.",
    "modifiers": { "eventDifficulty": 1.6 },
    "icon": "🐉"
  },
  {
    "name": "Whole Cake Island",
    "x": 22.6,
    "y": 47.2,
    "id": "whole_cake_island",
    "type": "HOSTILE",
    "description": "The terrifying centerpiece of Totto Land.",
    "modifiers": { "eventDifficulty": 2.5, "fruitDropChanceMult": 2.0 },
    "icon": "🎂"
  },
  {
    "name": "Pepe Kingdom",
    "x": 23.3,
    "y": 55.2,
    "id": "pepe_kingdom",
    "type": "TRADE",
    "description": "A quiet kingdom on the edge of Warlord territory.",
    "modifiers": { "marketDiscount": 0.9 },
    "icon": "👑"
  },
  {
    "name": "Karai Bari Island",
    "x": 27.3,
    "y": 56.5,
    "id": "karai_bari_island",
    "type": "HOSTILE",
    "description": "The base of Buggy's Delivery service.",
    "modifiers": { "eventDifficulty": 1.8, "goldMultiplier": 1.5 },
    "icon": "🎪"
  },
  {
    "name": "Egghead Island",
    "x": 31.8,
    "y": 50.1,
    "id": "egghead_island",
    "type": "MYSTERY",
    "description": "The island of the future, home to the greatest mind.",
    "modifiers": { "repairCost": 0.5, "fruitDropChanceMult": 1.5 },
    "icon": "🧠"
  },
  {
    "name": "Wano Country",
    "x": 31,
    "y": 45.4,
    "id": "wano_country",
    "type": "HOSTILE",
    "description": "An isolated nation of powerful samurai.",
    "modifiers": { "eventDifficulty": 2.2, "goldMultiplier": 1.3 },
    "icon": "🌸"
  },
  {
    "name": "Sphinx Island",
    "x": 34.1,
    "y": 52,
    "id": "sphinx_island",
    "type": "SAFE",
    "description": "A poor, peaceful island protected by a great pirate's legacy.",
    "modifiers": { "tavernCost": 0.5, "eventDifficulty": 0.5 },
    "icon": "🦁"
  },
  {
    "name": "Hachinosu",
    "x": 37.3,
    "y": 52.2,
    "id": "hachinosu",
    "type": "HOSTILE",
    "description": "Pirate Island. A lawless paradise for the worst scumbags.",
    "modifiers": { "eventDifficulty": 2.5, "recruitSuccess": 2.0, "goldMultiplier": 2.0 },
    "icon": "☠️"
  },
  {
    "name": "Elbaph",
    "x": 35.7,
    "y": 45,
    "id": "elbaph",
    "type": "DANGER",
    "description": "The proud kingdom of the giants.",
    "modifiers": { "eventDifficulty": 2.0, "recruitSuccess": 0.5 },
    "icon": "🛡️"
  },
  {
    "name": "Loadestar",
    "x": 44.1,
    "y": 50.1,
    "id": "loadestar",
    "type": "MYSTERY",
    "description": "The final island indicated by the Log Pose.",
    "modifiers": { "eventDifficulty": 2.0, "fruitDropChanceMult": 3.0 },
    "icon": "🧭"
  },
  {
    "name": "Loguetown",
    "x": 55.2,
    "y": 33.7,
    "id": "loguetown",
    "type": "TRADE",
    "description": "The town of the beginning and the end.",
    "modifiers": { "marketDiscount": 0.8, "recruitSuccess": 1.5 },
    "icon": "🏙️"
  },
  {
    "name": "Water Seven",
    "x": 85.1,
    "y": 50.4,
    "id": "water_seven",
    "type": "TRADE",
    "description": "The city of water, renowned for its shipwrights.",
    "modifiers": { "repairCost": 0.5, "marketDiscount": 1.1 },
    "icon": "⛲"
  },
  {
    "name": "Sabaody Archipelago",
    "x": 94.7,
    "y": 51.4,
    "id": "sabaody_archipelago",
    "type": "TRADE",
    "description": "A massive mangrove forest. The final stop in Paradise.",
    "modifiers": { "goldMultiplier": 1.5, "eventDifficulty": 1.5 },
    "icon": "🫧"
  },
  {
    "name": "Marineford",
    "x": 95.1,
    "y": 54.9,
    "id": "marineford",
    "type": "HOSTILE",
    "description": "The former Marine Headquarters. Highly dangerous.",
    "modifiers": { "eventDifficulty": 3.0, "goldMultiplier": 2.0 },
    "icon": "🏛️"
  },
  {
    "name": "Baltigo",
    "x": 21.8,
    "y": 57.2,
    "id": "baltigo",
    "type": "MYSTERY",
    "description": "The isle of white soil. Hard to find.",
    "modifiers": { "eventDifficulty": 1.5 },
    "icon": "🌪️"
  }
];

// Add generic islands based on the mapped coordinates
const MAPPED_COORDS = [
  {"name":"Uncharted Island 1","x":9.7,"y":50.7},
  {"name":"Uncharted Island 2","x":11.6,"y":54.3},
  {"name":"Uncharted Island 3","x":14.8,"y":48.4},
  {"name":"Uncharted Island 4","x":16.6,"y":46.3},
  {"name":"Uncharted Island 5","x":18.2,"y":51.2},
  {"name":"Uncharted Island 6","x":17.7,"y":54.9},
  {"name":"Uncharted Island 7","x":19.2,"y":55.6},
  {"name":"Uncharted Island 8","x":19.9,"y":57.9},
  {"name":"Uncharted Island 9","x":20.7,"y":55.4},
  {"name":"Uncharted Island 10","x":19.8,"y":52.8},
  {"name":"Topping","x":19.9,"y":50.7},
  {"name":"Unique","x":19.9,"y":49},
  {"name":"PiePie","x":19.1,"y":48.1},
  {"name":"Tanega","x":19.5,"y":46.6},
  {"name":"Komugi","x":18.9,"y":44.8},
  {"name":"Sanshoku","x":19.1,"y":42.9},
  {"name":"Rokumitsu","x":20.3,"y":42.8},
  {"name":"Yakigashi","x":20.4,"y":43.9},
  {"name":"Futoru","x":20.2,"y":45.8},
  {"name":"Black","x":20.2,"y":47.8},
  {"name":"Kimi","x":20.8,"y":50.2},
  {"name":"Package","x":21.4,"y":51.5},
  {"name":"Cheese","x":22,"y":50.1},
  {"name":"Biscuits","x":21.3,"y":48.5},
  {"name":"Poripori","x":21.3,"y":46.7},
  {"name":"Margarine","x":21.4,"y":44.5},
  {"name":"Noko","x":21.5,"y":43.9},
  {"name":"Kinko","x":21.8,"y":42.3},
  {"name":"Fruits","x":22.9,"y":42.5},
  {"name":"Cutlery","x":22.6,"y":44.9},
  {"name":"Ice","x":23.4,"y":44.5},
  {"name":"100% Island","x":24,"y":42.4},
  {"name":"Milenge","x":24.5,"y":42.9},
  {"name":"Kibo","x":24.8,"y":44.8},
  {"name":"Potato","x":25.6,"y":43.4},
  {"name":"Milk","x":26.1,"y":45.3},
  {"name":"Liqueur","x":25.3,"y":46.5},
  {"name":"Jelly","x":24,"y":46.7},
  {"name":"Candy","x":23.7,"y":48.4},
  {"name":"Funwari","x":25.4,"y":48.4},
  {"name":"Cacao","x":24.6,"y":49.9},
  {"name":"Jam","x":23.3,"y":50},
  {"name":"Nuts","x":22.6,"y":49.2},
  {"name":"Flavor","x":22.8,"y":51.4},
  {"name":"Loving","x":24,"y":51.2},
  {"name":"Uncharted Island 11","x":23.6,"y":53.1},
  {"name":"Uncharted Island 12","x":27.2,"y":47},
  {"name":"Ballon Terminal","x":27.9,"y":45.9},
  {"name":"Uncharted Island 13","x":27.5,"y":43.1},
  {"name":"Uncharted Island 14","x":27,"y":52.2},
  {"name":"Foodvalten Island","x":28.8,"y":49.8},
  {"name":"Uncharted Island 15","x":28.4,"y":53.1},
  {"name":"Mt. Kintoki","x":30,"y":56.8},
  {"name":"Marine Hospital","x":30.8,"y":53.8},
  {"name":"G-14","x":32,"y":52.6},
  {"name":"Onigashima","x":31,"y":45.4},
  {"name":"Udon","x":30.7,"y":44.4},
  {"name":"Kuri","x":30.2,"y":43.3},
  {"name":"Kibi","x":30.9,"y":42.7},
  {"name":"Ringo","x":31.8,"y":43.4},
  {"name":"Hakumai","x":31.5,"y":44.6},
  {"name":"Heaven World","x":35.7,"y":45},
  {"name":"Sun World","x":35.7,"y":46.5},
  {"name":"Underworld","x":35.3,"y":48.4},
  {"name":"Doerena Kingdom","x":35,"y":56.7},
  {"name":"Uncharted Island 16","x":37.6,"y":56.5},
  {"name":"Uncharted Island 17","x":10.7,"y":22.5},
  {"name":"Sankam Kingdom","x":11.7,"y":28.4},
  {"name":"Uncharted Island 18","x":12.7,"y":15.7},
  {"name":"Uncharted Island 19","x":13.5,"y":18.7},
  {"name":"Uncharted Island 20","x":13.8,"y":22.4},
  {"name":"Rakesh","x":16.1,"y":25},
  {"name":"Uncharted Island 21","x":15.3,"y":16.7},
  {"name":"Rubeck Island","x":17.6,"y":19},
  {"name":"Kuen Village","x":20.4,"y":15.4},
  {"name":"Spider Miles","x":19.4,"y":19.7},
  {"name":"White City","x":23.3,"y":15.7},
  {"name":"Minion Island","x":21.7,"y":19.8},
  {"name":"Swallow Island","x":19.8,"y":22.8},
  {"name":"Uncharted Island 22","x":17.4,"y":29.9},
  {"name":"Uncharted Island 23","x":18.6,"y":33.5},
  {"name":"Uncharted Island 24","x":22.6,"y":28.7},
  {"name":"Downs Island","x":24.2,"y":23.5},
  {"name":"Notice Town","x":26,"y":27.6},
  {"name":"Czacho Kingdom","x":27.3,"y":19},
  {"name":"Uncharted Island 25","x":27.2,"y":13.9},
  {"name":"Uncharted Island 26","x":24.8,"y":10.4},
  {"name":"Roshwan Kingdom","x":29.4,"y":12},
  {"name":"Whiteland Kingdom","x":32.5,"y":9.5},
  {"name":"Micqueot","x":36.1,"y":13.1},
  {"name":"Uncharted Island 27","x":37.9,"y":8.3},
  {"name":"Germa Kingdom","x":39.2,"y":12.8},
  {"name":"Uncharted Island 28","x":39,"y":18.1},
  {"name":"Lvneel Kingdom","x":35.1,"y":20.9},
  {"name":"Uncharted Island 29","x":31.4,"y":20},
  {"name":"Gingaball","x":34.1,"y":29},
  {"name":"Deul","x":38.5,"y":23.5},
  {"name":"Uncharted Island 30","x":29.5,"y":35},
  {"name":"Ilisia","x":12.7,"y":73.9},
  {"name":"Uncharted Island 31","x":10.9,"y":65.4},
  {"name":"Jambalaya","x":16.2,"y":67.6},
  {"name":"Uncharted Island 32","x":8.9,"y":68.7},
  {"name":"Ballywood","x":14.8,"y":81.3},
  {"name":"The land of ice","x":10.4,"y":90.2},
  {"name":"G-80","x":17.2,"y":79.4},
  {"name":"Toroa ","x":20.9,"y":86.8},
  {"name":"Uncharted Island 33","x":23.2,"y":77.9},
  {"name":"Uncharted Island 34","x":25,"y":80},
  {"name":"Shishano","x":24.7,"y":75.8},
  {"name":"Uncharted Island 35","x":22.8,"y":72.9},
  {"name":"Uncharted Island 36","x":28.7,"y":74.3},
  {"name":"God Valley","x":27.6,"y":77.3},
  {"name":"Uncharted Island 37","x":29.4,"y":77.6},
  {"name":"Ohara","x":20,"y":68.7},
  {"name":"Uncharted Island 38","x":21.3,"y":67.5},
  {"name":"Soja","x":33.4,"y":76.8},
  {"name":"Cameron","x":31.2,"y":86.3},
  {"name":"Bestland","x":30.4,"y":89.4},
  {"name":"Uncharted Island 39","x":26.1,"y":92.3},
  {"name":"Uncharted Island 40","x":32.8,"y":84},
  {"name":"Uncharted Island 41","x":33.2,"y":89.6},
  {"name":"Kano","x":36.6,"y":88.4},
  {"name":"Gingaball","x":37.1,"y":72.8},
  {"name":"Uncharted Island 42","x":40.9,"y":65.8},
  {"name":"Uncharted Island 43","x":33.5,"y":67.1},
  {"name":"Vira","x":39.8,"y":56.6},
  {"name":"Uncharted Island 44","x":39.7,"y":50},
  {"name":"Uncharted Island 45","x":39.9,"y":46.1},
  {"name":"Winner","x":37.3,"y":43.4},
  {"name":"Uncharted Island 46","x":40.8,"y":43.4},
  {"name":"Uncharted Island 47","x":41.9,"y":46.4},
  {"name":"Uncharted Island 48","x":41.2,"y":52.8},
  {"name":"Briss","x":62,"y":72.4},
  {"name":"Samba","x":64.4,"y":70.4},
  {"name":"Uncharted Island 49","x":56.8,"y":67.9},
  {"name":"Baterilla","x":61.9,"y":87},
  {"name":"South Fire","x":59.5,"y":89.6},
  {"name":"Taya","x":65.9,"y":81.6},
  {"name":"Kutsukku","x":71.3,"y":74.6},
  {"name":"Uncharted Island 50","x":68.8,"y":65.4},
  {"name":"Torino","x":77.2,"y":68.1},
  {"name":"Roshwan","x":78.2,"y":79.4},
  {"name":"Vespa","x":74.9,"y":84.2},
  {"name":"Centaurea","x":78.3,"y":81.8},
  {"name":"Uncharted Island 51","x":79.4,"y":84.7},
  {"name":"Tajine","x":75.4,"y":89.4},
  {"name":"Evil Black Drum","x":86,"y":83},
  {"name":"Sorbet","x":89.4,"y":77.9},
  {"name":"Uncharted Island 52","x":81.8,"y":73.1},
  {"name":"Uncharted Island 53","x":82.1,"y":65.9},
  {"name":"Tumi","x":86.2,"y":71.1},
  {"name":"Karate","x":91.7,"y":69.3},
  {"name":"Uncharted Island 54","x":56.5,"y":54.2},
  {"name":"Whisky Peak","x":57.3,"y":47.9},
  {"name":"Uncharted Island 55","x":58.3,"y":45},
  {"name":"Uncharted Island 56","x":58,"y":51},
  {"name":"Twins Cape","x":56.2,"y":50.6},
  {"name":"Uncharted Island 57","x":59.8,"y":52},
  {"name":"Little Garden","x":60.2,"y":46.3},
  {"name":"Uncharted Island 58","x":61.2,"y":43.8},
  {"name":"Kyuka","x":61.1,"y":48.8},
  {"name":"Bourgeois","x":60.9,"y":55.4},
  {"name":"Boin Archipelago","x":58.4,"y":57.3},
  {"name":"Skull","x":63.3,"y":53.4},
  {"name":"Renaisse","x":64.6,"y":50},
  {"name":"Momoiro","x":64.2,"y":56.5},
  {"name":"Drum","x":63.3,"y":45.8},
  {"name":"Uncharted Island 59","x":64.1,"y":43.1},
  {"name":"Elumalu","x":67.9,"y":46.1},
  {"name":"Rainbase","x":67.9,"y":44.8},
  {"name":"Alubarna","x":68.4,"y":44.7},
  {"name":"Tamarisk","x":68.9,"y":45.6},
  {"name":"Nanohana","x":68.5,"y":46.2},
  {"name":"Nanimonai","x":67,"y":47.4},
  {"name":"Nazawaka","x":91.7,"y":10.8},
  {"name":"Satsuruzu","x":89.1,"y":13.2},
  {"name":"Yotsuba","x":86.4,"y":12.6},
  {"name":"G-153","x":84.7,"y":15.6},
  {"name":"Mt. Corvo","x":87.8,"y":18.5},
  {"name":"Goa","x":87.4,"y":18.9},
  {"name":"Foosha","x":88.1,"y":19},
  {"name":"G-77","x":80.6,"y":18},
  {"name":"Nagagutsu","x":81.5,"y":12.3},
  {"name":"Kumate","x":84.9,"y":25.6},
  {"name":"Shimotsuki","x":90,"y":30.1},
  {"name":"Sixis","x":86.4,"y":35.3},
  {"name":"Orange","x":78,"y":21.4},
  {"name":"Syrup","x":71.4,"y":23.5},
  {"name":"MirrorBall","x":70.9,"y":17.5},
  {"name":"Frauce","x":65.5,"y":13.3},
  {"name":"G-16","x":66.6,"y":23.1},
  {"name":"Gosa","x":63.9,"y":21.6},
  {"name":"Cocoyashi","x":63,"y":22.6},
  {"name":"Arlong Park","x":62.4,"y":21.3},
  {"name":"Cozia","x":60.1,"y":16.8},
  {"name":"Uncharted Island 60","x":71.6,"y":29.9},
  {"name":"Uncharted Island 61","x":73.1,"y":29.4},
  {"name":"Uncharted Island 62","x":73.6,"y":32.1},
  {"name":"Uncharted Island 63","x":68,"y":33.2},
  {"name":"Uncharted Island 64","x":66.2,"y":31.6},
  {"name":"Oykot","x":63.8,"y":34.4},
  {"name":"Foolshout","x":67.8,"y":52.7},
  {"name":"Vodka","x":68.7,"y":56.7},
  {"name":"Uncharted Island 65","x":68.7,"y":50.4},
  {"name":"Weatheria","x":70,"y":51.6},
  {"name":"Jaya","x":72.4,"y":48.8},
  {"name":"Uncharted Island 66","x":71.6,"y":43.2},
  {"name":"Ukkari","x":74.4,"y":44.1},
  {"name":"Birka","x":76.2,"y":43.3},
  {"name":"Skypiea","x":75.2,"y":48.5},
  {"name":"Aoi","x":74.9,"y":54.6},
  {"name":"Uncharted Island 67","x":72,"y":52.7},
  {"name":"Shade","x":72.8,"y":56.6},
  {"name":"Kenzan","x":77.6,"y":57.1},
  {"name":"Long ring long land","x":77.9,"y":52.5},
  {"name":"G-8","x":77.9,"y":49.6},
  {"name":"Uncharted Island 68","x":77.5,"y":43.8},
  {"name":"Eigis","x":79.3,"y":47},
  {"name":"Uncharted Island 69","x":81,"y":43.4},
  {"name":"Uncharted Island 70","x":80.1,"y":49.8},
  {"name":"Harahetania","x":80,"y":55.4},
  {"name":"Pucci","x":82,"y":51.1},
  {"name":"Karakuri","x":82.4,"y":46.3},
  {"name":"G-3","x":83.2,"y":43.9},
  {"name":"Rommel","x":85.5,"y":44.1},
  {"name":"Banaro","x":85.6,"y":47.7},
  {"name":"Shift Station","x":83.3,"y":53.9},
  {"name":"San Faldo","x":82.6,"y":56.6},
  {"name":"Saint. Poplar","x":85.3,"y":56.2},
  {"name":"Guanhao","x":88,"y":56.6},
  {"name":"Thriller Bark","x":89.2,"y":49.7},
  {"name":"Uncharted Island 71","x":88,"y":44.2},
  {"name":"Kuraigana","x":91.3,"y":45.1},
  {"name":"Lulusia","x":94.5,"y":47.4},
  {"name":"G-2","x":95.3,"y":45.2},
  {"name":"Ennies Lobby","x":90,"y":54.9},
  {"name":"Amazon Lily","x":89.2,"y":60.3},
  {"name":"Impel Down","x":92.6,"y":59.5},
  {"name":"Rusukaina","x":87.8,"y":59.3},
  {"name":"Uncharted Island 72","x":42.2,"y":27.7}
].map((loc) => {
  // Turn raw JSON into our ISLANDS format
  const type = loc.name.startsWith("Uncharted") ? "MYSTERY" : "TRADE";
  return {
    name: loc.name,
    x: loc.x,
    y: loc.y,
    id: loc.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    type: type,
    description: loc.name.startsWith("Uncharted") ? "An island shrouded in mystery. Who knows what lies here?" : "A well-known island in these parts.",
    modifiers: {},
    icon: type === "MYSTERY" ? "❓" : "🏝️"
  }
});

// We append the MAPPED_COORDS to the handcrafted ones.
// We remove duplicates (if we hand-crafted an island that's also in the coords list)
MAPPED_COORDS.forEach(mapped => {
  if (!ISLANDS.find(i => i.id === mapped.id || i.name === mapped.name)) {
    ISLANDS.push(mapped);
  }
});

// ── Sea Zone Polygons ─────────────────────────────────────────────────────
// Each sea is defined by 4 corner points (x, y as % of map dimensions).
// Point-in-polygon uses ray casting (works for any simple polygon).

const SEA_ZONES = [
  {
    id: 'north_blue',
    polygon: [
      { x: 6.4,  y: 19   },
      { x: 25.8, y: 0.6  },
      { x: 44.7, y: 18.7 },
      { x: 24.5, y: 39.9 },
    ],
  },
  {
    id: 'east_blue',
    polygon: [
      { x: 52.7, y: 20.9 },
      { x: 75.4, y: 0.7  },
      { x: 95.3, y: 20.9 },
      { x: 75.2, y: 39.4 },
    ],
  },
  {
    id: 'south_blue',
    polygon: [
      { x: 73.8, y: 59.1 },
      { x: 52.6, y: 82.7 },
      { x: 73.4, y: 98.8 },
      { x: 95.5, y: 79.1 },
    ],
  },
  {
    id: 'west_blue',
    polygon: [
      { x: 24.1, y: 60.8 },
      { x: 5.2,  y: 81.3 },
      { x: 25.3, y: 99.3 },
      { x: 44.1, y: 81.6 },
    ],
  },
];

/**
 * Ray-casting point-in-polygon test.
 * @param {{ x: number, y: number }} point
 * @param {{ x: number, y: number }[]} polygon
 * @returns {boolean}
 */
function pointInPolygon(point, polygon) {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Returns the sea ID for a given island based on its map coordinates.
 * Returns null if the island doesn't fall inside any named sea zone.
 * @param {{ x: number, y: number }} island
 * @returns {string|null}
 */
export function getSeaForIsland(island) {
  for (const zone of SEA_ZONES) {
    if (pointInPolygon({ x: island.x, y: island.y }, zone.polygon)) {
      return zone.id;
    }
  }
  return null;
}

// ── Spawn Island Selection ────────────────────────────────────────────────

/**
 * Returns a random island suitable for a new player to spawn on.
 * Only picks islands that fall inside one of the four named sea zones
 * (North Blue, East Blue, South Blue, West Blue).
 * Prefers SAFE/TRADE/MYSTERY types; falls back to any sea-zone island.
 * @returns {import('./islands.js').Island}
 */
export function pickSpawnIsland() {
  const inASeaZone = i => SEA_ZONES.some(zone => pointInPolygon({ x: i.x, y: i.y }, zone.polygon));
  const safeTypes  = ['SAFE', 'TRADE', 'MYSTERY', 'MARINE'];

  let candidates = ISLANDS.filter(i => inASeaZone(i) && safeTypes.includes(i.type));

  // Fallback: any island inside a sea zone, regardless of type
  if (candidates.length === 0) {
    candidates = ISLANDS.filter(inASeaZone);
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}
