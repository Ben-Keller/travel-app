/* Wander prototype · data
   Photos are the Canva "Sri Lanka Moodboard" export (Elif Su Duygun), reused as placeholders.
   Metadata below is demo enrichment: durations, best time of day, seasonality, booking lead. */
window.WANDER_DATA = (function () {
  const A = 'assets/';
  const img = (f) => A + f;

  // ---- regions (bases) -------------------------------------------------
  const regions = {
    negombo:  { name: 'Negombo',      lat: 7.21, lon: 79.84, stay: 'p2_22_mirissa.jpg' },
    colombo:  { name: 'Colombo',      lat: 6.93, lon: 79.85, stay: 'p2_19_galle.jpg' },
    kandy:    { name: 'Kandy',        lat: 7.29, lon: 80.64, stay: 'p2_22_mirissa.jpg' },
    sigiriya: { name: 'Sigiriya',     lat: 7.96, lon: 80.76, stay: 'p2_27.jpg' },
    ella:     { name: 'Ella',         lat: 6.87, lon: 81.05, stay: 'p2_27.jpg' },
    yala:     { name: 'Yala',         lat: 6.37, lon: 81.52, stay: 'p2_27.jpg' },
    mirissa:  { name: 'Mirissa',      lat: 5.95, lon: 80.46, stay: 'p1_13.jpg' },
    galle:    { name: 'Galle',        lat: 6.03, lon: 80.22, stay: 'p2_19_galle.jpg' },
    trinco:   { name: 'Trincomalee',  lat: 8.59, lon: 81.22, stay: 'p1_13.jpg' },
    arugam:   { name: 'Arugam Bay',   lat: 6.84, lon: 81.83, stay: 'p2_22_mirissa.jpg' },
    jaffna:   { name: 'Jaffna',       lat: 9.66, lon: 80.01, stay: 'p2_22_mirissa.jpg' },
    hikkaduwa:{ name: 'Hikkaduwa',    lat: 6.14, lon: 80.10, stay: 'p1_13.jpg' },
    udawalawe:{ name: 'Udawalawe',    lat: 6.44, lon: 80.89, stay: 'p2_27.jpg' },
  };

  // ---- entities --------------------------------------------------------
  // type: place | site | experience | event | vibe | food | stay
  // dur in hours · best: dawn | day | dusk | night · cost: 0-3 · lead: booking lead in days (0 = walk-in)
  const E = [
    // Negombo / arrival
    { id: 'arrive',        name: 'Touch down over the lagoon', type: 'place', region: 'negombo', lat: 7.18, lon: 79.88, img: 'p2_04_negombo.jpg', dur: 2, best: 'day', cost: 0, lead: 0, tags: ['arrival'], blurb: 'Bandaranaike airport is 15 minutes from Negombo — land, sleep by the sea, start slow.' },
    { id: 'negombo-beach', name: 'Negombo beach & oruwa boats', type: 'site', region: 'negombo', lat: 7.22, lon: 79.83, img: 'p2_07_negombo.jpg', dur: 3, best: 'dusk', cost: 0, lead: 0, tags: ['beach','slow'], blurb: 'Outrigger boats come in at dusk; the fish market is at dawn.' },
    { id: 'negombo-lagoon',name: 'Lagoon sunset, Negombo', type: 'experience', region: 'negombo', lat: 7.16, lon: 79.85, img: 'p1_15.jpg', dur: 1.5, best: 'dusk', cost: 1, lead: 0, tags: ['slow','local'], blurb: 'A slow boat on the Negombo lagoon as the sun drops behind the palms.' },
    // Kandy
    { id: 'perahera',      name: 'Kandy Esala Perahera', type: 'event', region: 'kandy', lat: 7.294, lon: 80.641, img: 'p2_03_kandy.jpg', dur: 4, best: 'night', cost: 2, lead: 45, date: '2024-08-17', dateLabel: '10–20 Aug · final night 19 Aug', tags: ['event','iconic'], blurb: 'Ten nights of drummers, dancers and lit elephants circling the Temple of the Tooth. The Randoli nights (15–19 Aug) are the big ones; grandstand seats sell out weeks ahead.' },
    { id: 'kandy-train',   name: 'Kandy → Ella by train', type: 'experience', region: 'kandy', lat: 7.29, lon: 80.63, img: 'p1_06_train-rides.jpg', dur: 7, best: 'day', cost: 1, lead: 30, tags: ['iconic','train'], blurb: 'Seven hours through tea country. Reserved 2nd-class seats open 30 days out and go in minutes; unreserved is the adventure version.' },
    { id: 'peradeniya',    name: 'Royal Botanical Gardens, Peradeniya', type: 'site', region: 'kandy', lat: 7.27, lon: 80.60, img: 'p2_11_mirissa.jpg', dur: 2.5, best: 'day', cost: 1, lead: 0, tags: ['local','slow'], blurb: 'The palm avenue is the one on every postcard; the orchid house is the one locals go for.' },
    // Cultural triangle
    { id: 'sigiriya',      name: 'Sigiriya Lion Rock', type: 'site', region: 'sigiriya', lat: 7.957, lon: 80.760, img: 'p4_03_sigiriya.jpg', dur: 3.5, best: 'dawn', cost: 2, lead: 0, tags: ['iconic'], blurb: 'Go at 7 when the gates open — by 10 the rock is an oven. About 1,200 steps.' },
    { id: 'pidurangala',   name: 'Pidurangala sunrise', type: 'experience', region: 'sigiriya', lat: 7.973, lon: 80.762, img: 'p2_06_sigiriya.jpg', dur: 3, best: 'dawn', cost: 1, lead: 0, tags: ['iconic','dawn'], blurb: 'The rock opposite Sigiriya, with the better view of Sigiriya. Start climbing at 5:15 with a torch.' },
    { id: 'dambulla',      name: 'Dambulla cave temples', type: 'site', region: 'sigiriya', lat: 7.856, lon: 80.649, img: 'p2_09_galle.jpg', dur: 2, best: 'day', cost: 1, lead: 0, tags: ['iconic'], blurb: 'Five caves of reclining Buddhas under a painted ceiling. Cover shoulders and knees.' },
    { id: 'minneriya',     name: 'Minneriya — the Gathering', type: 'experience', region: 'sigiriya', lat: 8.03, lon: 80.90, img: 'p1_16_safari.jpg', dur: 4, best: 'dusk', cost: 2, lead: 7, season: 'Jul–Sep', tags: ['event','safari','season'], blurb: 'Up to 300 elephants gather on the tank bed in the dry months. August is peak — this is the reason to time a trip.' },
    // Hill country
    { id: 'nine-arch',     name: 'Nine Arch Bridge, Ella', type: 'site', region: 'ella', lat: 6.877, lon: 81.061, img: 'p1_14.jpg', dur: 2, best: 'dawn', cost: 0, lead: 0, tags: ['iconic'], blurb: 'Walk the tracks from Ella; the 9:30 train crosses with a whistle if you time it.' },
    { id: 'tea-mist',      name: 'Tea trails above Ella', type: 'experience', region: 'ella', lat: 6.86, lon: 81.04, img: 'p2_05_ella.jpg', dur: 3, best: 'day', cost: 0, lead: 0, tags: ['slow','hike'], blurb: 'Little Adam\'s Peak, then a factory tour and a cup at the source.' },
    { id: 'scooter-hills', name: 'Scooter the hill roads', type: 'vibe', region: 'ella', lat: 6.90, lon: 81.00, img: 'p1_19.jpg', dur: 4, best: 'day', cost: 1, lead: 0, tags: ['vibe'], blurb: 'Rent a scooter for the day; the Ella–Wellawaya road is the one.' },
    { id: 'horton',        name: 'Horton Plains — World\'s End', type: 'site', region: 'ella', lat: 6.80, lon: 80.80, img: 'p2_05_ella.jpg', dur: 5, best: 'dawn', cost: 2, lead: 0, tags: ['hike'], blurb: 'Leave by 5 to beat the cloud; the drop at World\'s End closes over by 10.' },
    { id: 'ella-cottage',  name: 'Hill cottage, Ella', type: 'stay', region: 'ella', lat: 6.87, lon: 81.05, img: 'p2_27.jpg', dur: 0, best: 'night', cost: 2, lead: 21, tags: ['stay'], blurb: 'A garden bungalow with a view down the gap. Two nights minimum in August.' },
    // Safari
    { id: 'yala-leopard',  name: 'Yala — leopard at dawn', type: 'experience', region: 'yala', lat: 6.37, lon: 81.52, img: 'p1_18.jpg', dur: 5, best: 'dawn', cost: 3, lead: 14, tags: ['iconic','safari'], blurb: 'Block 1 has the highest leopard density anywhere. Dry season sightings are good; jeeps queue at the gate from 5:30.' },
    { id: 'yala-elephant', name: 'Yala elephants', type: 'experience', region: 'yala', lat: 6.40, lon: 81.45, img: 'p2_16_yala.jpg', dur: 4, best: 'dusk', cost: 2, lead: 7, tags: ['safari'], blurb: 'The afternoon drive is quieter and the light is better.' },
    { id: 'yala-deer',     name: 'Slow safari, Bundala', type: 'experience', region: 'yala', lat: 6.20, lon: 81.20, img: 'p2_18_yala.jpg', dur: 3, best: 'dawn', cost: 1, lead: 0, tags: ['slow','local'], blurb: 'Birds, deer and no jeep queues. The locals\' park.' },
    { id: 'udawalawe',     name: 'Udawalawe elephants', type: 'experience', region: 'udawalawe', lat: 6.44, lon: 80.89, img: 'p2_25.jpg', dur: 4, best: 'dusk', cost: 2, lead: 3, tags: ['safari','local'], blurb: 'Guaranteed elephants, an hour off the Ella–coast road.' },
    // South coast
    { id: 'coconut-hill',  name: 'Coconut Tree Hill, Mirissa', type: 'site', region: 'mirissa', lat: 5.944, lon: 80.470, img: 'p2_14_galle.jpg', dur: 1, best: 'dusk', cost: 0, lead: 0, tags: ['iconic','beach'], blurb: 'Ten minutes\' walk from the beach; go for the last hour of light.' },
    { id: 'whales',        name: 'Whale watching, Mirissa', type: 'experience', region: 'mirissa', lat: 5.90, lon: 80.45, img: 'p1_10_galle.jpg', dur: 5, best: 'dawn', cost: 2, lead: 3, season: 'Nov–Apr', offSeason: true, tags: ['season'], blurb: 'Blue whales, Nov–Apr. In August the sea is rough and boats mostly don\'t go out.' },
    { id: 'parrot-rock',   name: 'Parrot Rock & Secret Beach', type: 'site', region: 'mirissa', lat: 5.946, lon: 80.458, img: 'p2_17_mirissa.jpg', dur: 2, best: 'day', cost: 0, lead: 0, tags: ['beach','slow'], blurb: 'Wade out at low tide; the cove round the headland is the quiet one.' },
    { id: 'villa',         name: 'Sea-view villa breakfast', type: 'stay', region: 'mirissa', lat: 5.95, lon: 80.44, img: 'p1_13.jpg', dur: 0, best: 'day', cost: 3, lead: 30, tags: ['stay','slow'], blurb: 'Papaya, curd and treacle on a terrace over the bay.' },
    { id: 'stilt',         name: 'Stilt fishermen, Koggala', type: 'site', region: 'galle', lat: 5.985, lon: 80.335, img: 'p2_24.jpg', dur: 1, best: 'dusk', cost: 0, lead: 0, tags: ['iconic'], blurb: 'Mostly for the photo these days — tip the fishermen, go at sunset.' },
    { id: 'cove',          name: 'Hidden cove near Tangalle', type: 'site', region: 'mirissa', lat: 6.02, lon: 80.80, img: 'p1_20_sri-lankan-curry.jpg', dur: 3, best: 'day', cost: 0, lead: 0, tags: ['beach','slow'], blurb: 'Hiriketiya\'s quieter neighbour. Bring water; there\'s nothing there, which is the point.' },
    { id: 'galle-fort',    name: 'Galle Fort ramparts & lighthouse', type: 'site', region: 'galle', lat: 6.026, lon: 80.217, img: 'p2_13_galle.jpg', dur: 2, best: 'dusk', cost: 0, lead: 0, tags: ['iconic'], blurb: 'Walk the full circuit of the Dutch walls at sunset, finish at the lighthouse.' },
    { id: 'galle-cafe',    name: 'Fort café mornings', type: 'food', region: 'galle', lat: 6.028, lon: 80.215, img: 'p2_08_galle.jpg', dur: 1.5, best: 'day', cost: 1, lead: 0, tags: ['slow','food'], blurb: 'Pedlar Street before the tour buses. Egg hoppers and a proper coffee.' },
    { id: 'galle-cycle',   name: 'Cycle the fort lanes', type: 'experience', region: 'galle', lat: 6.03, lon: 80.22, img: 'p1_12.jpg', dur: 2, best: 'day', cost: 0, lead: 0, tags: ['slow'], blurb: 'Borrow a bike from your guesthouse; the lanes are flat and shaded.' },
    { id: 'galle-stay',    name: 'Boutique stay in the fort', type: 'stay', region: 'galle', lat: 6.027, lon: 80.218, img: 'p2_19_galle.jpg', dur: 0, best: 'night', cost: 3, lead: 30, tags: ['stay'], blurb: 'A merchant\'s house behind the walls. Courtyards, high ceilings, a pool the size of a bath.' },
    { id: 'unawatuna',     name: 'Unawatuna beach', type: 'site', region: 'galle', lat: 6.01, lon: 80.25, img: 'p1_09_unawatuna.jpg', dur: 3, best: 'day', cost: 0, lead: 0, tags: ['beach','slow'], blurb: 'The sheltered bay — swimmable even in monsoon months.' },
    { id: 'hikkaduwa',     name: 'Hikkaduwa sunset', type: 'site', region: 'hikkaduwa', lat: 6.14, lon: 80.10, img: 'p1_08_hikkaduwa.jpg', dur: 2, best: 'dusk', cost: 0, lead: 0, tags: ['beach','slow'], blurb: 'Turtles come in to the reef beach in the late afternoon.' },
    { id: 'beach-evenings',name: 'Beach town evenings', type: 'vibe', region: 'galle', lat: 6.00, lon: 80.30, img: 'p1_07_beach-towns.jpg', dur: 2, best: 'dusk', cost: 1, lead: 0, tags: ['vibe','beach'], blurb: 'Barefoot dinners, one beer, early night. The south coast rhythm.' },
    // Colombo
    { id: 'colombo-night', name: 'Colombo at night', type: 'site', region: 'colombo', lat: 6.927, lon: 79.858, img: 'p2_15_colombo.jpg', dur: 2, best: 'night', cost: 1, lead: 0, tags: ['city'], blurb: 'Galle Face Green at dusk — kites, isso wade, the Lotus Tower lighting up.' },
    { id: 'pettah',        name: 'Pettah market & tuk-tuks', type: 'experience', region: 'colombo', lat: 6.937, lon: 79.852, img: 'p2_23_colombo.jpg', dur: 2.5, best: 'day', cost: 0, lead: 0, tags: ['local','city'], blurb: 'Each street sells one thing. Go before 11 and let a tuk-tuk get lost with you.' },
    { id: 'galleries',     name: 'Colombo galleries', type: 'site', region: 'colombo', lat: 6.905, lon: 79.860, img: 'p2_21_colombo.jpg', dur: 2, best: 'day', cost: 0, lead: 0, tags: ['city','slow'], blurb: 'Saskia Fernando, Barefoot, the Lionel Wendt — an afternoon loop.' },
    { id: 'coastal-train', name: 'Coastal train into Colombo', type: 'experience', region: 'colombo', lat: 6.85, lon: 79.87, img: 'p2_10_colombo.jpg', dur: 2.5, best: 'day', cost: 0, lead: 0, tags: ['local','train'], blurb: 'The line runs on the sand from Galle to Fort. Sit left, doors open.' },
    { id: 'garden-dinner', name: 'Dinner in a garden restaurant', type: 'food', region: 'colombo', lat: 6.91, lon: 79.86, img: 'p2_26.jpg', dur: 2, best: 'night', cost: 2, lead: 2, tags: ['food','city'], blurb: 'Last night, long table, crab curry.' },
    // Food & vibes (anywhere)
    { id: 'curry',         name: 'Rice & curry feast', type: 'food', region: 'kandy', lat: 7.30, lon: 80.62, img: 'p1_21_sri-lankan-curry.jpg', dur: 1.5, best: 'day', cost: 1, lead: 0, tags: ['food'], blurb: 'Eight little bowls, one plate of rice. Every region does it differently.' },
    { id: 'roti',          name: 'Coconut roti & pol sambol', type: 'food', region: 'galle', lat: 6.03, lon: 80.23, img: 'p1_17_coconut-roti.jpg', dur: 1, best: 'day', cost: 0, lead: 0, tags: ['food'], blurb: 'Breakfast, from a roadside hut, with a cup of plain tea.' },
    { id: 'king-coconut',  name: 'Fresh king coconut', type: 'food', region: 'mirissa', lat: 5.95, lon: 80.47, img: 'p1_22_coconut-roti.jpg', dur: 0.5, best: 'day', cost: 0, lead: 0, tags: ['food','slow'], blurb: 'Orange, not green. Every hundred metres of road.' },
    { id: 'island-chill',  name: 'Island chill', type: 'vibe', region: 'mirissa', lat: 5.96, lon: 80.50, img: 'p1_03_island-chill.jpg', dur: 4, best: 'day', cost: 0, lead: 0, tags: ['vibe','slow'], blurb: 'Hammock, palm, nothing on the calendar.' },
    { id: 'slow-beach',    name: 'Slow beach days', type: 'vibe', region: 'galle', lat: 6.05, lon: 80.20, img: 'p1_05_island-chill.jpg', dur: 5, best: 'day', cost: 0, lead: 0, tags: ['vibe','slow','beach'], blurb: 'Shells, a book, the same café twice.' },
    { id: 'guesthouse',    name: 'Family guesthouse', type: 'stay', region: 'kandy', lat: 7.30, lon: 80.65, img: 'p2_22_mirissa.jpg', dur: 0, best: 'night', cost: 1, lead: 7, tags: ['stay','local'], blurb: 'Home cooking, a mother who will not let you leave hungry.' },
    // East & north — in season in August
    { id: 'trinco',        name: 'Trincomalee — Nilaveli beach', type: 'place', region: 'trinco', lat: 8.59, lon: 81.22, img: 'p1_09_unawatuna.jpg', dur: 6, best: 'day', cost: 1, lead: 0, season: 'May–Sep', tags: ['beach','season'], blurb: 'The east coast is in season when the south-west is in monsoon. Flat sea, Pigeon Island snorkelling.' },
    { id: 'arugam',        name: 'Arugam Bay surf', type: 'place', region: 'arugam', lat: 6.84, lon: 81.83, img: 'p1_07_beach-towns.jpg', dur: 6, best: 'dawn', cost: 1, lead: 0, season: 'May–Sep', tags: ['beach','season','surf'], blurb: 'August is peak swell. Main Point for the good surfers, Baby Point for the rest of us.' },
    { id: 'nallur',        name: 'Nallur festival, Jaffna', type: 'event', region: 'jaffna', lat: 9.674, lon: 80.030, img: 'p1_21_sri-lankan-curry.jpg', dur: 3, best: 'dusk', cost: 0, lead: 0, date: '2024-08-22', dateLabel: '2–26 Aug', tags: ['event'], blurb: 'Twenty-five days of chariot processions at the Kandaswamy temple. Very far north — a trip in itself.' },
  ];

  const byId = Object.fromEntries(E.map(e => [e.id, e]));
  E.forEach(e => { e.src = img(e.img); e.regionName = regions[e.region].name; });

  // ---- shelves ---------------------------------------------------------
  const shelves = [
    { id: 'iconic', title: 'Iconic', why: 'the canonical Sri Lanka set', ids: ['sigiriya','kandy-train','nine-arch','yala-leopard','galle-fort','coconut-hill','dambulla','pidurangala','stilt'] },
    { id: 'dates',  title: 'Only during your dates', why: '10 – 24 Aug 2024 · events and seasonal moments', ids: ['perahera','minneriya','trinco','arugam','nallur','whales'] },
    { id: 'near',   title: 'Near what you\'ve picked', why: 'appears after your first add', ids: [], dynamic: true },
    { id: 'slow',   title: 'Slow days', why: 'low effort, low transit', ids: ['villa','unawatuna','parrot-rock','cove','galle-cafe','galle-cycle','hikkaduwa','king-coconut','yala-deer'] },
    { id: 'food',   title: 'Sri Lankan food', why: 'eat like it\'s the point', ids: ['curry','roti','king-coconut','galle-cafe','garden-dinner'] },
    { id: 'local',  title: 'Where locals go', why: 'editorial picks, fewer tour buses', ids: ['pettah','coastal-train','peradeniya','negombo-lagoon','udawalawe','yala-deer','negombo-beach'] },
    { id: 'vibes',  title: 'Vibes', why: 'a mood, translated into places', ids: ['island-chill','slow-beach','scooter-hills','beach-evenings','tea-mist'] },
    { id: 'stays',  title: 'Stays', why: 'the bed shapes the day', ids: ['villa','galle-stay','ella-cottage','guesthouse'] },
    { id: 'city',   title: 'Colombo, last', why: 'one night is enough, two is better', ids: ['colombo-night','pettah','galleries','garden-dinner','coastal-train','arrive'] },
  ];

  // ---- world search ----------------------------------------------------
  const destinations = [
    { name: 'Sri Lanka', lat: 7.5, lon: 80.7, ready: true, sub: 'island · 14 days is the classic loop' },
    { name: 'Japan', lat: 36, lon: 138, sub: 'coming soon in this prototype' },
    { name: 'Portugal', lat: 39.5, lon: -8, sub: 'coming soon in this prototype' },
    { name: 'Türkiye', lat: 39, lon: 35, sub: 'coming soon in this prototype' },
    { name: 'Vietnam', lat: 16, lon: 107.5, sub: 'coming soon in this prototype' },
    { name: 'Morocco', lat: 31.8, lon: -7, sub: 'coming soon in this prototype' },
    { name: 'Greece', lat: 39, lon: 22, sub: 'coming soon in this prototype' },
    { name: 'Indonesia', lat: -2.5, lon: 118, sub: 'coming soon in this prototype' },
    { name: 'Peru', lat: -9.2, lon: -75, sub: 'coming soon in this prototype' },
    { name: 'Kenya', lat: 0.5, lon: 37.8, sub: 'coming soon in this prototype' },
    { name: 'Iceland', lat: 65, lon: -18, sub: 'coming soon in this prototype' },
    { name: 'Mexico', lat: 23.6, lon: -102.5, sub: 'coming soon in this prototype' },
  ];
  const cities = [[51.5,-0.1],[48.9,2.3],[40.4,-3.7],[41.9,12.5],[52.5,13.4],[55.8,37.6],[41.0,29.0],[30.0,31.2],[25.2,55.3],[28.6,77.2],[19.1,72.9],[13.1,80.3],[6.9,79.9],[13.8,100.5],[1.35,103.8],[-6.2,106.8],[22.3,114.2],[31.2,121.5],[39.9,116.4],[35.7,139.7],[37.6,127],[-33.9,151.2],[-37.8,145],[-41.3,174.8],[40.7,-74],[34.1,-118.2],[41.9,-87.6],[19.4,-99.1],[-23.5,-46.6],[-34.6,-58.4],[-12.0,-77.0],[4.7,-74.1],[-1.3,36.8],[-26.2,28.0],[6.5,3.4],[33.6,-7.6],[64.1,-21.9],[59.9,10.8],[60.2,24.9],[-8.7,115.2],[27.7,85.3],[43.7,-79.4],[49.3,-123.1],[21.3,-157.8],[-17.5,-149.5],[64.8,-147.7],[55.7,12.6],[50.1,14.4],[47.5,19.0],[38.7,-9.1],[-4.3,15.3],[15.6,32.5],[9.0,38.7],[24.7,46.7],[33.3,44.4],[35.7,51.4],[41.3,69.3],[43.2,76.9],[47.9,106.9],[16.9,96.2],[21.0,105.8],[10.8,106.7],[14.6,121.0],[3.1,101.7],[-15.8,-47.9],[-33.4,-70.7],[10.5,-66.9],[18.5,-69.9],[23.1,-82.4],[45.5,-73.6]];

  // ---- itinerary options ----------------------------------------------
  // Each day: base region, slots [{id, t: 'HH:MM'}], and the leg *into* this day from the previous base
  // mode: drive | rail | fly | walk | ferry
  const options = [
    {
      id: 'classic', thesis: 'The Classic Loop', tag: 'Sees the most', trade: 'a new bed most nights',
      accent: '#FF6A2B',
      days: [
        { base: 'negombo', slots: [{ id: 'arrive', t: '13:40' }, { id: 'negombo-beach', t: '17:00' }] },
        { base: 'kandy', leg: { mode: 'drive', min: 190 }, slots: [{ id: 'peradeniya', t: '14:00' }, { id: 'curry', t: '19:00' }] },
        { base: 'kandy', slots: [{ id: 'guesthouse', t: '09:00' }, { id: 'perahera', t: '19:30' }] },
        { base: 'sigiriya', leg: { mode: 'drive', min: 150 }, slots: [{ id: 'dambulla', t: '13:00' }, { id: 'minneriya', t: '15:30' }] },
        { base: 'sigiriya', slots: [{ id: 'pidurangala', t: '05:15' }, { id: 'sigiriya', t: '07:30' }] },
        { base: 'ella', leg: { mode: 'drive', min: 150, note: 'to Kandy station' }, slots: [{ id: 'kandy-train', t: '08:47' }, { id: 'ella-cottage', t: '17:00' }] },
        { base: 'ella', slots: [{ id: 'nine-arch', t: '08:30' }, { id: 'tea-mist', t: '11:00' }, { id: 'scooter-hills', t: '15:00' }] },
        { base: 'yala', leg: { mode: 'drive', min: 165 }, slots: [{ id: 'yala-elephant', t: '15:00' }] },
        { base: 'mirissa', leg: { mode: 'drive', min: 180 }, slots: [{ id: 'yala-leopard', t: '05:30' }, { id: 'coconut-hill', t: '17:30' }] },
        { base: 'mirissa', slots: [{ id: 'villa', t: '08:00' }, { id: 'parrot-rock', t: '10:00' }, { id: 'king-coconut', t: '12:30' }, { id: 'island-chill', t: '14:00' }] },
        { base: 'galle', leg: { mode: 'drive', min: 50 }, slots: [{ id: 'stilt', t: '07:30' }, { id: 'galle-cafe', t: '09:30' }, { id: 'galle-fort', t: '17:30' }] },
        { base: 'galle', slots: [{ id: 'galle-cycle', t: '08:00' }, { id: 'unawatuna', t: '11:00' }, { id: 'roti', t: '13:00' }, { id: 'beach-evenings', t: '18:30' }] },
        { base: 'colombo', leg: { mode: 'rail', min: 150 }, slots: [{ id: 'coastal-train', t: '09:20' }, { id: 'pettah', t: '14:00' }, { id: 'colombo-night', t: '18:30' }] },
        { base: 'colombo', slots: [{ id: 'galleries', t: '10:00' }, { id: 'garden-dinner', t: '19:30' }] },
        { base: 'colombo', end: true, slots: [] },
      ],
      reasons: { whales: 'off-season in August — boats rarely go out', trinco: '6 h from every base on this loop', arugam: 'would cost Galle and Mirissa', nallur: 'a two-day detour north', horton: 'a 4 a.m. start the day after the train', hikkaduwa: 'same beach as Unawatuna, an hour further', udawalawe: 'Yala covers it', 'yala-deer': 'Yala covers it', 'negombo-lagoon': 'arrival day is enough', cove: 'no time on the south coast leg', 'slow-beach': 'covered by Mirissa day', 'galle-stay': 'guesthouse budget on this loop' },
    },
    {
      id: 'slow', thesis: 'The Slow South', tag: 'One coast, done properly', trade: 'skips Sigiriya and the safari',
      accent: '#1B6C86',
      days: [
        { base: 'negombo', slots: [{ id: 'arrive', t: '13:40' }, { id: 'negombo-lagoon', t: '17:30' }] },
        { base: 'kandy', leg: { mode: 'drive', min: 190 }, slots: [{ id: 'peradeniya', t: '14:00' }, { id: 'curry', t: '19:00' }] },
        { base: 'kandy', slots: [{ id: 'guesthouse', t: '09:00' }, { id: 'perahera', t: '19:30' }] },
        { base: 'ella', leg: { mode: 'rail', min: 420 }, slots: [{ id: 'kandy-train', t: '08:47' }, { id: 'ella-cottage', t: '17:00' }] },
        { base: 'ella', slots: [{ id: 'nine-arch', t: '08:30' }, { id: 'tea-mist', t: '11:00' }] },
        { base: 'mirissa', leg: { mode: 'drive', min: 240 }, slots: [{ id: 'udawalawe', t: '10:30' }, { id: 'coconut-hill', t: '17:30' }] },
        { base: 'mirissa', slots: [{ id: 'villa', t: '08:00' }, { id: 'parrot-rock', t: '10:00' }, { id: 'island-chill', t: '13:00' }] },
        { base: 'mirissa', slots: [{ id: 'cove', t: '09:00' }, { id: 'king-coconut', t: '12:30' }, { id: 'beach-evenings', t: '18:30' }] },
        { base: 'mirissa', slots: [{ id: 'slow-beach', t: '09:00' }, { id: 'stilt', t: '17:30' }] },
        { base: 'galle', leg: { mode: 'drive', min: 50 }, slots: [{ id: 'galle-stay', t: '13:00' }, { id: 'galle-fort', t: '17:30' }] },
        { base: 'galle', slots: [{ id: 'galle-cafe', t: '08:30' }, { id: 'galle-cycle', t: '10:00' }, { id: 'roti', t: '13:00' }, { id: 'unawatuna', t: '15:00' }] },
        { base: 'galle', slots: [{ id: 'hikkaduwa', t: '16:00' }] },
        { base: 'colombo', leg: { mode: 'rail', min: 150 }, slots: [{ id: 'coastal-train', t: '09:20' }, { id: 'galleries', t: '14:00' }, { id: 'colombo-night', t: '18:30' }] },
        { base: 'colombo', slots: [{ id: 'pettah', t: '09:00' }, { id: 'garden-dinner', t: '19:30' }] },
        { base: 'colombo', end: true, slots: [] },
      ],
      reasons: { sigiriya: 'the cultural triangle is a 2-day detour north', pidurangala: 'goes with Sigiriya', dambulla: 'goes with Sigiriya', minneriya: 'goes with Sigiriya', 'yala-leopard': 'traded for four slow nights in Mirissa', 'yala-elephant': 'Udawalawe covers it in an hour', whales: 'off-season in August', trinco: 'wrong coast', arugam: 'wrong coast', nallur: 'a two-day detour north', horton: 'a 4 a.m. start the day after the train', 'scooter-hills': 'only one full day in Ella', 'yala-deer': 'no Yala leg', 'negombo-beach': 'lagoon instead' },
    },
    {
      id: 'east', thesis: 'East, in Season', tag: 'Follows the weather', trade: 'no Galle, no Mirissa',
      accent: '#3F8A5B',
      days: [
        { base: 'negombo', slots: [{ id: 'arrive', t: '13:40' }, { id: 'negombo-beach', t: '17:00' }] },
        { base: 'sigiriya', leg: { mode: 'drive', min: 210 }, slots: [{ id: 'dambulla', t: '13:00' }, { id: 'minneriya', t: '15:30' }] },
        { base: 'sigiriya', slots: [{ id: 'pidurangala', t: '05:15' }, { id: 'sigiriya', t: '07:30' }] },
        { base: 'trinco', leg: { mode: 'drive', min: 120 }, slots: [{ id: 'trinco', t: '12:00' }] },
        { base: 'trinco', slots: [{ id: 'trinco', t: '08:00' }, { id: 'king-coconut', t: '12:30' }] },
        { base: 'trinco', slots: [{ id: 'slow-beach', t: '09:00' }] },
        { base: 'arugam', leg: { mode: 'drive', min: 300 }, slots: [{ id: 'arugam', t: '16:00' }] },
        { base: 'arugam', slots: [{ id: 'arugam', t: '06:00' }, { id: 'island-chill', t: '13:00' }] },
        { base: 'arugam', slots: [{ id: 'arugam', t: '06:00' }, { id: 'beach-evenings', t: '18:30' }] },
        { base: 'yala', leg: { mode: 'drive', min: 180 }, slots: [{ id: 'yala-elephant', t: '15:00' }] },
        { base: 'ella', leg: { mode: 'drive', min: 150 }, slots: [{ id: 'yala-leopard', t: '05:30' }, { id: 'ella-cottage', t: '17:00' }] },
        { base: 'ella', slots: [{ id: 'nine-arch', t: '08:30' }, { id: 'tea-mist', t: '11:00' }, { id: 'scooter-hills', t: '15:00' }] },
        { base: 'kandy', leg: { mode: 'rail', min: 420 }, slots: [{ id: 'kandy-train', t: '06:40' }, { id: 'perahera', t: '19:30' }] },
        { base: 'colombo', leg: { mode: 'drive', min: 190 }, slots: [{ id: 'pettah', t: '14:00' }, { id: 'garden-dinner', t: '19:30' }] },
        { base: 'colombo', end: true, slots: [] },
      ],
      reasons: { 'galle-fort': 'wrong coast for August', 'coconut-hill': 'wrong coast for August', whales: 'off-season everywhere in August', stilt: 'wrong coast', unawatuna: 'wrong coast', villa: 'wrong coast', 'galle-cafe': 'wrong coast', 'galle-cycle': 'wrong coast', 'galle-stay': 'wrong coast', hikkaduwa: 'wrong coast', cove: 'wrong coast', 'parrot-rock': 'wrong coast', roti: 'eat it in Trinco instead', peradeniya: 'Kandy is one night, and it\'s Perahera night', nallur: 'a day further north than Trinco', horton: 'a 4 a.m. start the day after the train', udawalawe: 'Yala covers it', 'yala-deer': 'Yala covers it', 'colombo-night': 'one Colombo night', galleries: 'one Colombo night', 'coastal-train': 'arriving from Kandy by road', 'negombo-lagoon': 'beach instead', guesthouse: 'Kandy is one night', curry: 'Perahera night' },
    },
  ];

  // ---- warnings by entity (shown inline in the itinerary) --------------
  const warnings = {
    whales:      { level: 'bad',  text: 'off-season · rough seas, boats rarely sail' },
    'kandy-train': { level: 'warn', text: 'reserved seats sell out · book 30 days ahead' },
    perahera:    { level: 'warn', text: 'grandstand seats sell out · book now' },
    sigiriya:    { level: 'warn', text: 'go at gate-open · 34° by 10:00' },
    'yala-leopard': { level: 'ok',  text: 'dry season · good sightings' },
    minneriya:   { level: 'ok',   text: 'peak of the Gathering' },
    unawatuna:   { level: 'warn', text: 'SW monsoon · afternoon showers likely' },
    'coconut-hill': { level: 'warn', text: 'SW monsoon · check the sky at 16:00' },
    trinco:      { level: 'ok',   text: 'east coast in season' },
    arugam:      { level: 'ok',   text: 'peak swell' },
    horton:      { level: 'warn', text: 'cloud closes World\'s End by 10:00' },
  };

  // ---- questions (chosen by the planner from the tray) -----------------
  const questions = {
    whales: { id: 'q-whales', kind: 'conflict', title: 'Whale watching is out of season', body: 'Blue whales are off Mirissa from November to April. In August the sea is rough and most boats stay in.', map: ['whales','trinco'],
      options: [ { k: 'drop', label: 'Drop it', note: 'recommended' }, { k: 'swap', label: 'Swap for the east coast', note: 'Trincomalee is in season' }, { k: 'keep', label: 'Keep it anyway', note: 'we\'ll flag it' } ] },
    coasts: { id: 'q-coasts', kind: 'conflict', title: 'Two coasts in fourteen days', body: 'The south coast and the east coast are about 9 hours apart by road. Doing both means two long transit days and less time in the hills.', map: ['galle-fort','trinco'],
      options: [ { k: 'south', label: 'Prefer the south', note: 'Galle, Mirissa' }, { k: 'east', label: 'Prefer the east', note: 'in season in August' }, { k: 'both', label: 'Do both', note: '+9 h driving' } ] },
    pace: { id: 'q-pace', kind: 'slider', title: 'How full should a day be?', body: 'This sets how many things land on each day and how early the alarm goes.', min: 'Slow', max: 'Packed' },
    base: { id: 'q-base', kind: 'pick', title: 'How do you like to move?', body: 'A loop sees more and unpacks more. Bases see less and sleep better.',
      options: [ { k: 'loop', label: 'A loop', note: 'new bed every 2 nights', img: 'p1_06_train-rides.jpg' }, { k: 'bases', label: 'Two or three bases', note: 'day trips out', img: 'p1_13.jpg' } ] },
    budget: { id: 'q-budget', kind: 'pick', title: 'Which of these looks like your trip?', body: 'Not a number. Just the shape of it.',
      options: [ { k: 'g', label: 'Guesthouses & trains', note: '€', img: 'p2_22_mirissa.jpg' }, { k: 'b', label: 'Boutique & a driver', note: '€€', img: 'p2_19_galle.jpg' }, { k: 'v', label: 'Villas & short flights', note: '€€€', img: 'p1_13.jpg' } ] },
  };

  // ---- Sri Lanka outline (lon, lat) — stylised ---------------------------
  const outline = [[80.23,9.83],[80.05,9.80],[79.90,9.70],[79.92,9.55],[80.10,9.45],[80.05,9.25],[79.85,9.05],[79.80,8.90],[79.72,8.60],[79.80,8.40],[79.78,8.10],[79.83,7.90],[79.82,7.60],[79.84,7.20],[79.84,6.95],[79.86,6.75],[79.95,6.45],[80.02,6.30],[80.10,6.15],[80.22,6.02],[80.45,5.95],[80.60,5.92],[80.80,6.02],[81.05,6.10],[81.30,6.20],[81.50,6.35],[81.70,6.45],[81.83,6.75],[81.86,7.00],[81.80,7.40],[81.70,7.75],[81.60,8.00],[81.40,8.30],[81.25,8.55],[81.15,8.70],[80.95,8.85],[80.85,9.10],[80.70,9.30],[80.45,9.55],[80.30,9.70]];

  // ---- decorative watercolor assets ------------------------------------
  const deco = {
    splashOrange: img('p1_04_orange-watercolor-splotch-shape.png'),
    splashPink: img('p1_02_pink-watercolor-splatter.png'),
    splashSoft: img('p1_01_soft-watercolor-splash-stain-background.png'),
    splashPastel: img('p1_11_watercolor-splash-splatter-pastel.png'),
    splashBlue: img('p4_02_watercolor-splash-clip-art.png'),
    brush: img('p1_23_watercolor-brush-stroke.png'),
    elephant: img('p4_16_elephant-watercolor-illustration.png'),
    turtle: img('p4_18_watercolor-turtle-illustration.png'),
    whale: img('p4_24_whale-watercolor-illustration.png'),
    lighthouse: img('p4_19_watercolor-galle-lighthouse-sri-lanka.png'),
    mountains: img('p4_09_watercolor-landscape-with-mountains.png'),
    island: img('p4_23_island-watercolor-illustration.png'),
    scooter: img('p4_22_watercolor-blue-scooter.png'),
    umbrella: img('p4_06_umbrella-beach-watercolor-illustration-f.png'),
    tickets: img('p4_10_airplane-tickets-watercolor.png'),
    lotus: img('p4_13_lotus-tower-sri-lanka-clipart.png'),
    camera: img('p4_17_watercolor-photography-composition-illus.png'),
    grapefruit: img('p4_07_watercolor-grapefruit-slice.png'),
  };
  const mapStickers = [
    { src: deco.elephant, lat: 8.45, lon: 80.15, w: 46 },
    { src: deco.mountains, lat: 6.70, lon: 80.45, w: 44 },
    { src: deco.lighthouse, lat: 5.98, lon: 80.10, w: 18 },
    { src: deco.turtle, lat: 6.30, lon: 79.70, w: 26 },
    { src: deco.whale, lat: 5.60, lon: 81.05, w: 40 },
    { src: deco.island, lat: 8.90, lon: 81.55, w: 30 },
    { src: deco.umbrella, lat: 7.35, lon: 79.55, w: 20 },
    { src: deco.lotus, lat: 6.93, lon: 79.72, w: 9 },
    { src: deco.scooter, lat: 6.60, lon: 81.30, w: 16 },
  ];

  return { regions, entities: E, byId, shelves, destinations, cities, options, warnings, questions, outline, deco, mapStickers, trip: { dest: 'Sri Lanka', start: '2024-08-10', end: '2024-08-24', party: 'Couple' } };
})();
