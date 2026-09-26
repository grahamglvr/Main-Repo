/* Reelbook — reference data (shot vocabulary, frame rates, palettes, checklists). */
window.RB = window.RB || {};

RB.categories = [
  { id: 'establishing', name: 'Establishing', icon: '🏙️', color: '#5b8def', desc: 'Sets place, time and tone. Usually wide and often the first shot of a scene.' },
  { id: 'character', name: 'Character', icon: '🧍', color: '#e0795c', desc: 'Introduces or features a person. Framing tells us who they are.' },
  { id: 'talking', name: 'Talking / Dialogue', icon: '🗣️', color: '#d9a441', desc: 'Interviews, talking heads, conversations and over-the-shoulder coverage.' },
  { id: 'detail', name: 'Detail / Insert', icon: '🔍', color: '#8f7ae6', desc: 'Close details such as hands, textures, a key prop or a screen.' },
  { id: 'object', name: 'Object / Product', icon: '📦', color: '#3fb6a8', desc: 'Hero shots of a product or story-significant object.' },
  { id: 'action', name: 'Action', icon: '🏃', color: '#e05c7a', desc: 'Movement, stunts, sport and physical activity.' },
  { id: 'reaction', name: 'Reaction', icon: '😮', color: '#e6b35c', desc: "A character's response. Often sells the moment more than the action." },
  { id: 'broll', name: 'B-roll / Cutaway', icon: '🎞️', color: '#7a9e5c', desc: 'Supporting footage to cut away to, hide edits and add texture.' },
  { id: 'pov', name: 'POV', icon: '👁️', color: '#5cc3e6', desc: 'What a character sees, which puts the audience in their shoes.' },
  { id: 'mood', name: 'Mood / Atmosphere', icon: '🌅', color: '#c27ae6', desc: 'Ambient shots for tone: weather, light, textures and environment.' },
  { id: 'transition', name: 'Transition', icon: '🔀', color: '#9aa3b2', desc: 'Bridges scenes with match cuts, whip pans, wipes and reveals.' }
];

RB.sizes = [
  { id: 'EWS', name: 'Extreme Wide', desc: 'Subject tiny in a vast environment.', use: 'Scale, isolation and location. Great establishing shot.' },
  { id: 'WS', name: 'Wide', desc: 'Whole environment with the subject in it.', use: 'Scene geography, blocking and master shots.' },
  { id: 'FS', name: 'Full', desc: 'Head to toe.', use: 'Body language, costume and movement.' },
  { id: 'MWS', name: 'Medium Wide / Cowboy', desc: 'Mid-thigh up.', use: 'Groups, gesture and walk-and-talks.' },
  { id: 'MS', name: 'Medium', desc: 'Waist up.', use: 'Neutral conversational coverage.' },
  { id: 'MCU', name: 'Medium Close-Up', desc: 'Chest up.', use: 'Interviews, and emotion that still keeps some context.' },
  { id: 'CU', name: 'Close-Up', desc: 'Face fills the frame.', use: 'Emotion, intimacy and emphasis.' },
  { id: 'ECU', name: 'Extreme Close-Up', desc: 'Eyes, lips or a tiny detail.', use: 'Intensity, tension and key information.' },
  { id: 'INS', name: 'Insert', desc: 'Tight shot of an object or action.', use: 'Show information the audience must notice.' }
];

RB.angles = [
  { id: 'eye', name: 'Eye level', desc: 'Camera at the subject’s eye height.', use: 'Neutral and relatable. The default for dialogue and interviews.' },
  { id: 'high', name: 'High angle', desc: 'Camera looks down on the subject.', use: 'Makes the subject feel small, weak or vulnerable.' },
  { id: 'low', name: 'Low angle', desc: 'Camera looks up at the subject.', use: 'Power, dominance, heroism or threat.' },
  { id: 'overhead', name: "Bird's eye / Overhead", desc: 'Directly above, looking straight down.', use: 'God’s-eye view, patterns, flat-lays, food and maps.' },
  { id: 'worms', name: "Worm's eye", desc: 'From the ground, looking steeply up.', use: 'Extreme scale, towering subjects and architecture.' },
  { id: 'ground', name: 'Ground level', desc: 'Camera sits on the floor.', use: 'Footsteps, pets or kids’ perspective, dramatic foreground.' },
  { id: 'dutch', name: 'Dutch / Canted', desc: 'Horizon deliberately tilted.', use: 'Unease, disorientation, madness or instability.' },
  { id: 'ots', name: 'Over-the-shoulder', desc: 'Framed past a foreground shoulder.', use: 'Conversation geography and connection between characters.' },
  { id: 'pov', name: 'Point of view', desc: 'Camera sees what the character sees.', use: 'Immersion and subjectivity.' }
];

RB.movements = [
  { id: 'static', name: 'Static / Locked-off', type: 'static', gear: 'Tripod', desc: 'No camera movement at all.', use: 'Stability and observation. Lets the action play out in frame.' },
  { id: 'pan', name: 'Pan', type: 'moving', gear: 'Tripod + fluid head', desc: 'Rotates horizontally on a fixed point.', use: 'Follow action or reveal a space.' },
  { id: 'tilt', name: 'Tilt', type: 'moving', gear: 'Tripod + fluid head', desc: 'Rotates vertically on a fixed point.', use: 'Reveal height, or a top-to-bottom reveal of a character.' },
  { id: 'pushin', name: 'Push in', type: 'moving', gear: 'Dolly / slider / gimbal', desc: 'Camera physically moves toward the subject.', use: 'Builds tension, focus or a moment of realisation.' },
  { id: 'pullout', name: 'Pull out', type: 'moving', gear: 'Dolly / slider / gimbal', desc: 'Camera moves away from the subject.', use: 'Reveals context, isolation. Classic ending shot.' },
  { id: 'truck', name: 'Truck / Tracking', type: 'moving', gear: 'Dolly / gimbal / vehicle', desc: 'Moves alongside the subject.', use: 'Walk-and-talks, energy, following a journey.' },
  { id: 'follow', name: 'Follow / Lead', type: 'moving', gear: 'Gimbal / Steadicam', desc: 'Moves behind or in front of a walking subject.', use: 'Immersion, and pulling the audience along with a character.' },
  { id: 'pedestal', name: 'Pedestal', type: 'moving', gear: 'Jib / tripod column', desc: 'Raises or lowers the camera without tilting.', use: 'Reveal over foreground objects.' },
  { id: 'crane', name: 'Crane / Jib', type: 'moving', gear: 'Jib / crane / drone', desc: 'Sweeping vertical or arcing move.', use: 'Grand openings, big reveals and endings.' },
  { id: 'handheld', name: 'Handheld', type: 'moving', gear: 'Shoulder rig', desc: 'Operator holds the camera.', use: 'Urgency, realism and documentary intimacy.' },
  { id: 'gimbal', name: 'Gimbal / Steadicam', type: 'moving', gear: 'Gimbal / Steadicam', desc: 'Smooth floating movement.', use: 'Long takes and smooth, immersive follow shots.' },
  { id: 'orbit', name: 'Arc / Orbit', type: 'moving', gear: 'Gimbal / dolly track', desc: 'Circles around the subject.', use: 'Drama, heroic moments and 360° product shots.' },
  { id: 'slider', name: 'Slider', type: 'moving', gear: 'Slider', desc: 'Short, smooth linear move.', use: 'Adds subtle life to product, detail and interview shots.' },
  { id: 'zoom', name: 'Zoom', type: 'moving', gear: 'Zoom lens', desc: 'Changes focal length during the shot.', use: 'Vintage or doc feel, sudden emphasis, comedic snap zooms.' },
  { id: 'dollyzoom', name: 'Dolly zoom (Vertigo)', type: 'moving', gear: 'Dolly + zoom lens', desc: 'Dolly one way while zooming the other.', use: 'Unease, vertigo, a sudden realisation.' },
  { id: 'whip', name: 'Whip pan', type: 'moving', gear: 'Tripod / handheld', desc: 'Very fast pan with heavy motion blur.', use: 'Energetic transitions and comedic timing.' },
  { id: 'drone', name: 'Drone / Aerial', type: 'moving', gear: 'Drone', desc: 'Flying camera.', use: 'Establishing shots, scale and landscapes. Check local flight rules.' }
];

RB.techniques = [
  { group: 'Composition', name: 'Rule of thirds', desc: 'Place key subjects on the third lines or where they cross.', use: 'Balanced, natural-feeling frames. Put the eyes on the top third.' },
  { group: 'Composition', name: 'Leading lines', desc: 'Roads, rails or walls that point to the subject.', use: 'Guide the viewer’s eye and add depth.' },
  { group: 'Composition', name: 'Symmetry / centre framing', desc: 'Subject dead-centre with a mirrored frame.', use: 'Formal, stylised, confrontational. Think Wes Anderson or Kubrick.' },
  { group: 'Composition', name: 'Frame within a frame', desc: 'Doorways, windows or mirrors frame the subject.', use: 'Focus, entrapment and voyeurism.' },
  { group: 'Composition', name: 'Negative space', desc: 'Large empty areas around the subject.', use: 'Loneliness, freedom, or room for titles.' },
  { group: 'Composition', name: 'Foreground layering', desc: 'Put objects in the foreground, midground and background.', use: 'Depth and production value, especially when the camera moves.' },
  { group: 'Composition', name: 'Look room / lead room', desc: 'Leave space in the direction the subject faces or moves.', use: 'Frames that feel natural. Remove the space on purpose for tension.' },
  { group: 'Focus & Lens', name: 'Shallow depth of field', desc: 'Wide aperture, so only the subject is sharp.', use: 'Isolate the subject and get a cinematic background blur.' },
  { group: 'Focus & Lens', name: 'Deep focus', desc: 'Everything sharp from front to back.', use: 'Complex staging and multiple planes of action (Citizen Kane).' },
  { group: 'Focus & Lens', name: 'Rack / pull focus', desc: 'Shift focus between subjects mid-shot.', use: 'Redirect attention and reveal information.' },
  { group: 'Focus & Lens', name: 'Wide lens (≤24mm)', desc: 'Exaggerated depth and distortion up close.', use: 'Energy, environment, and unease when used close.' },
  { group: 'Focus & Lens', name: 'Telephoto (≥85mm)', desc: 'Compressed background, flattering faces.', use: 'Portraits, compression and voyeuristic distance.' },
  { group: 'Lighting', name: 'Three-point lighting', desc: 'Key, fill and back light.', use: 'Clean, reliable setup for interviews and corporate work.' },
  { group: 'Lighting', name: 'Motivated lighting', desc: 'Light that appears to come from a real source in the scene.', use: 'Naturalism and believability.' },
  { group: 'Lighting', name: 'Rembrandt lighting', desc: 'Triangle of light on the shadow-side cheek.', use: 'Moody, painterly portraits.' },
  { group: 'Lighting', name: 'Low-key / chiaroscuro', desc: 'Strong contrast and deep shadows.', use: 'Drama, noir, horror and mystery.' },
  { group: 'Lighting', name: 'High-key', desc: 'Bright and even with few shadows.', use: 'Comedy, commercials and upbeat tone.' },
  { group: 'Lighting', name: 'Silhouette', desc: 'Subject backlit to a dark shape.', use: 'Mystery, anonymity and striking shapes.' },
  { group: 'Lighting', name: 'Practicals', desc: 'Visible lamps or screens in the shot.', use: 'Motivate your light and add depth and colour.' },
  { group: 'Continuity', name: '180° rule', desc: 'Keep the camera on one side of the line of action.', use: 'Keeps screen direction and eyelines consistent.' },
  { group: 'Continuity', name: '30° rule', desc: 'Move at least 30° between cuts of the same subject.', use: 'Avoids jarring jump cuts.' },
  { group: 'Continuity', name: 'Coverage', desc: 'Shoot a master, then mediums, then close-ups of a scene.', use: 'Gives the editor options for pacing and performance.' },
  { group: 'Continuity', name: 'Eyeline match', desc: 'A look, then a cut to what they see.', use: 'Connects characters to objects and each other.' },
  { group: 'Editing', name: 'Match cut', desc: 'Cut between shots with matching shape, motion or sound.', use: 'Elegant transitions that link ideas.' },
  { group: 'Editing', name: 'J-cut & L-cut', desc: 'Audio leads (J) or trails (L) the picture cut.', use: 'Smooth, natural dialogue and scene transitions.' },
  { group: 'Editing', name: 'Speed ramp', desc: 'Change playback speed within a clip.', use: 'Emphasise action beats. Shoot at a high frame rate.' },
  { group: 'Editing', name: 'Long take / oner', desc: 'An extended shot with no cuts.', use: 'Immersion, tension and virtuoso staging.' },
  { group: 'Special', name: 'Time-lapse', desc: 'Frames captured at intervals.', use: 'Show the passing of time, like clouds, cities or crowds.' },
  { group: 'Special', name: 'Hyperlapse', desc: 'A time-lapse where the camera moves.', use: 'Dynamic travel and city sequences.' },
  { group: 'Special', name: 'Split diopter', desc: 'Two focal planes sharp at once.', use: 'Stylised tension between near and far subjects.' }
];

RB.frameRates = [
  { fps: '23.976', label: '23.976 / 24 fps', tag: 'Cinematic', why: 'The film standard. With a 1/48 shutter it gives the natural motion blur audiences read as “cinema”.', use: 'Narrative, music videos, commercials, anything that should feel filmic.', shutter: '1/48 → 1/50' },
  { fps: '25', label: '25 fps', tag: 'PAL', why: 'The broadcast standard in 50 Hz regions (UK, Europe, Australia, much of Asia and Africa). It stops flicker under 50 Hz mains lighting.', use: 'TV and online work in PAL regions. Still looks close to 24.', shutter: '1/50' },
  { fps: '29.97', label: '29.97 / 30 fps', tag: 'NTSC', why: 'The broadcast standard in 60 Hz regions (US, Canada, Japan). Slightly smoother and more “video” look. Matches 60 Hz lighting.', use: 'News, events, vlogs, social media, livestreams.', shutter: '1/60' },
  { fps: '48', label: '48 fps', tag: 'HFR / 2× slow', why: 'High frame rate cinema (The Hobbit) looks hyper-real. Conformed to 24 it gives a gentle 2× slow motion.', use: 'Subtle slow motion, dreamy moments.', shutter: '1/96 → 1/100' },
  { fps: '50', label: '50 fps', tag: '2× slow (PAL)', why: 'Double 25 fps. Smooth for sports and live broadcast in PAL regions, or 2× slow motion on a 25p timeline.', use: 'Sport, B-roll with a gentle slow down.', shutter: '1/100' },
  { fps: '59.94', label: '59.94 / 60 fps', tag: 'Smooth / 2.5× slow', why: 'Very smooth motion. On a 24p timeline it plays at 40% speed (2.5× slower).', use: 'Gaming, sports, screen capture, general slow-mo B-roll.', shutter: '1/120 → 1/125' },
  { fps: '120', label: '100 / 120 fps', tag: '4–5× slow', why: 'Proper slow motion. Needs about 2 stops more light than 24 fps and may drop resolution on some cameras.', use: 'Action beats, hair flips, dramatic moments, speed ramps.', shutter: '1/240 → 1/250' },
  { fps: '240', label: '180 / 240+ fps', tag: 'Super slow', why: 'Extreme slow motion that reveals motion the eye never sees. Needs lots of light and often a crop or lower resolution.', use: 'Water splashes, product drops, sports impacts.', shutter: '1/480 → 1/500' }
];

RB.fpsOptions = ['23.976', '24', '25', '29.97', '30', '48', '50', '59.94', '60', '100', '120', '180', '240'];

RB.fpsWhy = fps => {
  const f = parseFloat(fps);
  if (!f) return '';
  const hit = RB.frameRates.find(r => {
    const n = parseFloat(r.fps);
    return Math.abs(n - f) < 0.6 || (n === 23.976 && f === 24) || (n === 29.97 && f === 30) || (n === 59.94 && f === 60) || (n === 120 && f === 100) || (n === 240 && f === 180);
  });
  return hit ? `${hit.tag}: ${hit.why}` : '';
};

RB.aspects = [
  { id: '16:9', ratio: 16 / 9, note: 'HD / UHD standard: YouTube, TV' },
  { id: '2.39:1', ratio: 2.39, note: 'Anamorphic / Scope cinema' },
  { id: '1.85:1', ratio: 1.85, note: 'Flat cinema' },
  { id: '4:3', ratio: 4 / 3, note: 'Vintage TV, intimate, retro' },
  { id: '1:1', ratio: 1, note: 'Square social feed' },
  { id: '4:5', ratio: 4 / 5, note: 'Instagram portrait feed' },
  { id: '9:16', ratio: 9 / 16, note: 'Vertical: Reels, TikTok, Shorts' }
];

RB.resolutions = ['720p HD', '1080p Full HD', '2.7K', '4K UHD', '4K DCI', '5.7K', '6K', '8K'];

RB.palettePresets = [
  { name: 'Teal & Orange', mood: 'Blockbuster contrast. Warm skin pops against cool shadows.', colors: ['#0b3c49', '#1f6f78', '#f6e7cb', '#f2a65a', '#e26d3d'] },
  { name: 'Film Noir', mood: 'Hard light, deep shadows, moral ambiguity.', colors: ['#0d0d0d', '#2b2b2b', '#595959', '#a6a6a6', '#ededed'] },
  { name: 'Pastel Symmetry', mood: 'Whimsical, storybook, nostalgic and precise.', colors: ['#f1bb7b', '#fd6467', '#e6a0c4', '#c6cdf7', '#7294d4'] },
  { name: 'Golden Hour', mood: 'Warm, romantic, hopeful, end-of-day glow.', colors: ['#2e1f27', '#854d27', '#dd7230', '#f4c95d', '#e7e393'] },
  { name: 'Neon Nights', mood: 'Cyberpunk, nightlife, electric and synthetic.', colors: ['#0d0221', '#261447', '#ff3864', '#2de2e6', '#f6019d'] },
  { name: 'Bleach Bypass', mood: 'Desaturated grit for war, thrillers and harsh realism.', colors: ['#1c1c1c', '#4a4e4d', '#7f8c8d', '#b8b8aa', '#e0ddcf'] },
  { name: 'Earthy Documentary', mood: 'Grounded, honest, organic and human.', colors: ['#3d405b', '#81b29a', '#f2cc8f', '#e07a5f', '#f4f1de'] },
  { name: 'Cold Thriller', mood: 'Clinical, isolated, tense (Fincher-esque).', colors: ['#0b1d2a', '#1b3b5a', '#406e8e', '#8ea8c3', '#cbd4de'] },
  { name: 'Vintage Kodachrome', mood: 'Saturated 70s nostalgia with warm reds and yellows.', colors: ['#7a2e1d', '#c4502a', '#e3b23c', '#3f6e5e', '#efe3c8'] },
  { name: 'Moonlight Blue', mood: 'Night exteriors, melancholy, dreamlike calm.', colors: ['#0a1128', '#001f54', '#034078', '#1282a2', '#fefcfb'] },
  { name: 'Matrix Green', mood: 'Digital, sickly, artificial, uncanny.', colors: ['#0a0f0a', '#1a2e1a', '#3b6b3b', '#8fbf6a', '#d4e8c4'] },
  { name: 'Desert Heat', mood: 'Arid, epic, sun-bleached (Dune, Mad Max).', colors: ['#3b2314', '#8c4a22', '#d98c4a', '#f2c48d', '#f7e6cf'] }
];

RB.colorPsych = [
  { color: '#d64545', name: 'Red', meaning: 'Passion, love, anger, danger, power' },
  { color: '#e8893a', name: 'Orange', meaning: 'Warmth, energy, youth, friendliness, exotic' },
  { color: '#e8c93a', name: 'Yellow', meaning: 'Joy, optimism, but also madness, sickness, caution' },
  { color: '#4caf6a', name: 'Green', meaning: 'Nature, growth, but also envy, poison, the uncanny' },
  { color: '#3a7be8', name: 'Blue', meaning: 'Calm, trust, sadness, isolation, cold' },
  { color: '#8e5ad6', name: 'Purple', meaning: 'Mystery, royalty, fantasy, the supernatural' },
  { color: '#e87fb4', name: 'Pink', meaning: 'Innocence, romance, sweetness, playfulness' },
  { color: '#8a6a4a', name: 'Brown', meaning: 'Earthiness, comfort, reliability, the past' },
  { color: '#111111', name: 'Black', meaning: 'Power, elegance, death, the unknown' },
  { color: '#f2f2f2', name: 'White', meaning: 'Purity, emptiness, sterility, new beginnings' }
];

RB.prepChecklist = [
  'Brief / script locked',
  'Shot list complete',
  'Storyboard or references shared with crew',
  'Locations scouted and photographed',
  'Location permits / permissions confirmed',
  'Talent & location release forms ready',
  'Weather forecast checked (with a backup plan)',
  'Sunrise / sunset & golden hour checked',
  'Call sheet sent to crew & talent',
  'Batteries charged',
  'Memory cards backed up & formatted',
  'Sensor & lenses cleaned',
  'Camera settings pre-set (codec, fps, shutter, WB)',
  'Audio levels & timecode tested',
  'Transport, parking & catering sorted'
];

RB.gearDefaults = {
  'Camera': ['Camera body', 'Spare camera / B-cam', 'Batteries', 'Charger', 'Memory cards'],
  'Lenses & Filters': ['Wide lens', 'Standard lens', 'Telephoto lens', 'ND / variable ND filters', 'Lens cloth & blower'],
  'Support': ['Tripod + fluid head', 'Gimbal', 'Slider', 'Shoulder rig'],
  'Audio': ['Shotgun mic', 'Lav mics', 'Audio recorder', 'Headphones', 'Boom pole', 'Dead cat / windshield'],
  'Lighting': ['Key light', 'Fill / bounce', 'Backlight / tube lights', 'Light stands', 'Diffusion & gels'],
  'Grip': ['C-stands', 'Sandbags', 'Clamps', 'Gaffer tape', 'Extension leads'],
  'Data': ['Laptop', 'Card reader', 'Backup drives ×2', 'Cables & adapters'],
  'Admin': ['Release forms', 'Permits', 'Call sheet', 'Slate / clapper'],
  'Crew care': ['First aid kit', 'Water & snacks', 'Rain cover / umbrella', 'Sunscreen']
};

RB.wrapChecklist = [
  { group: 'On set', items: ['Final shot list review (nothing missed?)', 'Room tone / wild track recorded', 'Signed releases collected', 'Location left clean & as found', 'Gear counted & packed against list', 'Batteries on charge'] },
  { group: 'Data (3-2-1 rule)', items: ['Offload every card before formatting', 'Copy 1: working drive', 'Copy 2: separate backup drive', 'Copy 3: offsite / cloud', 'Verify copies (checksum or spot-check playback)', 'Label cards & drives', 'Log media in the table below'] }
];

RB.postPipeline = [
  { id: 'ingest', name: 'Ingest & organise', desc: 'Copy media, create folder structure (Footage / Audio / GFX / Music / Exports), rename clips.' },
  { id: 'proxies', name: 'Proxies & sync', desc: 'Generate proxies if needed. Sync sound via timecode, waveform or slate clap.' },
  { id: 'selects', name: 'Selects / stringout', desc: 'Watch everything, mark circled takes and favourite moments.' },
  { id: 'assembly', name: 'Assembly', desc: 'Everything in story order, long and rough.' },
  { id: 'rough', name: 'Rough cut', desc: 'Shape the story and performance. Share for first feedback.' },
  { id: 'fine', name: 'Fine cut', desc: 'Tighten timing, trims, pacing, J/L cuts.' },
  { id: 'lock', name: 'Picture lock', desc: 'No more edit changes. Hand off to colour & sound.' },
  { id: 'vfx', name: 'VFX & clean-up', desc: 'Stabilise, remove objects, screen replacements, compositing.' },
  { id: 'correct', name: 'Colour correction', desc: 'Balance exposure & white balance, match shots.' },
  { id: 'grade', name: 'Colour grade', desc: 'Create the look. Refer to your palette.' },
  { id: 'sound', name: 'Sound edit & design', desc: 'Dialogue clean-up, SFX, ambience, foley.' },
  { id: 'music', name: 'Music & licensing', desc: 'Pick tracks and confirm licences cover the platform & territory.' },
  { id: 'mix', name: 'Mix & loudness', desc: 'Balance dialogue, music, SFX. Hit the platform’s loudness target.' },
  { id: 'gfx', name: 'Titles & graphics', desc: 'Title cards, lower thirds, credits, logos.' },
  { id: 'captions', name: 'Captions & subtitles', desc: 'SRT / burned-in captions for accessibility & social.' },
  { id: 'export', name: 'Export & QC', desc: 'Export masters and watch the whole thing for glitches, typos and audio pops.' },
  { id: 'deliver', name: 'Deliver', desc: 'Upload, send links, collect sign-off.' },
  { id: 'archive', name: 'Archive', desc: 'Project file, media & exports archived on 2+ drives.' }
];

RB.deliverySpecs = [
  { name: 'YouTube', aspect: '16:9', res: '3840×2160 or 1920×1080', codec: 'H.264 / MP4, AAC 48 kHz', fps: 'Same as shot', extra: 'About 35–45 Mbps for 4K SDR, 8–12 Mbps for 1080p. Loudness normalised to around −14 LUFS.' },
  { name: 'Reels / TikTok / Shorts', aspect: '9:16', res: '1080×1920', codec: 'H.264 / MP4', fps: '24–60', extra: 'Keep text and faces out of the top ~15% and bottom ~20%, where the UI covers them.' },
  { name: 'Instagram feed', aspect: '4:5', res: '1080×1350', codec: 'H.264 / MP4', fps: '24–60', extra: '4:5 takes the most screen space in the feed.' },
  { name: 'Vimeo', aspect: 'Any', res: 'Up to 8K', codec: 'H.264, H.265 or ProRes', fps: 'Same as shot', extra: 'Higher bitrate uploads are fine. Good for client review.' },
  { name: 'Broadcast (UK / EU)', aspect: '16:9', res: '1920×1080 (25i/50p) or UHD', codec: 'ProRes 422 HQ / XDCAM HD', fps: '25', extra: 'Loudness −23 LUFS (EBU R128). Always check the broadcaster’s own spec sheet.' },
  { name: 'Broadcast (US)', aspect: '16:9', res: '1920×1080 or UHD', codec: 'ProRes 422 HQ', fps: '29.97 / 23.976', extra: 'Loudness −24 LKFS (ATSC A/85). Check the network spec.' },
  { name: 'Cinema DCP', aspect: '1.85 / 2.39', res: '1998×1080 flat · 2048×858 scope', codec: 'JPEG 2000 DCP', fps: '24', extra: 'Build with a DCP tool. Test on a real projector before the screening.' },
  { name: 'Client master', aspect: 'Native', res: 'Native', codec: 'ProRes 422 HQ / DNxHR HQ', fps: 'Native', extra: 'High-quality archival master to make every other deliverable from.' }
];

RB.codecs = [
  { name: 'H.264 1080p', mbps: 50 },
  { name: 'H.264 4K', mbps: 100 },
  { name: 'H.265 4K 10-bit', mbps: 150 },
  { name: 'ProRes 422 LT 4K', mbps: 330 },
  { name: 'ProRes 422 4K', mbps: 471 },
  { name: 'ProRes 422 HQ 4K', mbps: 707 },
  { name: 'ProRes 422 HQ 1080p', mbps: 176 },
  { name: 'BRAW 12:1 4K', mbps: 135 },
  { name: 'Custom', mbps: 0 }
];

RB.ndTable = [
  { nd: 'ND2', od: '0.3', stops: 1 }, { nd: 'ND4', od: '0.6', stops: 2 }, { nd: 'ND8', od: '0.9', stops: 3 },
  { nd: 'ND16', od: '1.2', stops: 4 }, { nd: 'ND32', od: '1.5', stops: 5 }, { nd: 'ND64', od: '1.8', stops: 6 },
  { nd: 'ND128', od: '2.1', stops: 7 }, { nd: 'ND256', od: '2.4', stops: 8 }, { nd: 'ND1000', od: '3.0', stops: 10 }
];

/* Starter shot lists, loaded from the empty state. */
RB.templates = [
  {
    name: 'Interview / Documentary',
    shots: [
      { scene: '1', category: 'establishing', size: 'EWS', angle: 'eye', movement: 'drone', desc: 'Exterior of location, sets the world', fps: '24' },
      { scene: '1', category: 'broll', size: 'WS', angle: 'eye', movement: 'slider', desc: 'Subject arriving / walking into space', fps: '60' },
      { scene: '2', category: 'talking', size: 'MCU', angle: 'eye', movement: 'static', desc: 'Main interview, A-cam, subject looks just off-lens', fps: '24' },
      { scene: '2', category: 'talking', size: 'CU', angle: 'eye', movement: 'static', desc: 'Interview B-cam, 30°+ off A-cam', fps: '24' },
      { scene: '3', category: 'detail', size: 'ECU', angle: 'eye', movement: 'handheld', desc: 'Hands at work / personal objects', fps: '60' },
      { scene: '3', category: 'character', size: 'MS', angle: 'low', movement: 'gimbal', desc: 'Subject in their environment doing what they do', fps: '24' },
      { scene: '3', category: 'mood', size: 'WS', angle: 'eye', movement: 'static', desc: 'Atmospheric time-lapse for chapter breaks', fps: '24' }
    ]
  },
  {
    name: 'Product / Commercial',
    shots: [
      { scene: '1', category: 'object', size: 'CU', angle: 'eye', movement: 'orbit', desc: 'Hero product reveal on turntable, rim light', fps: '24' },
      { scene: '1', category: 'detail', size: 'ECU', angle: 'eye', movement: 'slider', desc: 'Texture / logo / material close-up', fps: '24' },
      { scene: '1', category: 'object', size: 'INS', angle: 'overhead', movement: 'static', desc: 'Flat-lay with accessories', fps: '24' },
      { scene: '2', category: 'action', size: 'MS', angle: 'eye', movement: 'handheld', desc: 'Product in use, lifestyle', fps: '60' },
      { scene: '2', category: 'reaction', size: 'CU', angle: 'eye', movement: 'pushin', desc: 'Happy customer reaction', fps: '24' },
      { scene: '2', category: 'action', size: 'CU', angle: 'eye', movement: 'static', desc: 'Slow-mo splash / drop moment', fps: '240' },
      { scene: '3', category: 'object', size: 'MS', angle: 'eye', movement: 'pullout', desc: 'End card: product + logo with negative space for text', fps: '24' }
    ]
  },
  {
    name: 'Short Film Scene',
    shots: [
      { scene: '1', category: 'establishing', size: 'WS', angle: 'high', movement: 'crane', desc: 'Exterior, night. Crane down to the diner window', fps: '24' },
      { scene: '1', category: 'character', size: 'MS', angle: 'eye', movement: 'pushin', desc: 'Protagonist alone in a booth, slow push', fps: '24' },
      { scene: '1', category: 'talking', size: 'MCU', angle: 'ots', movement: 'static', desc: 'OTS on A, favouring B', fps: '24' },
      { scene: '1', category: 'talking', size: 'MCU', angle: 'ots', movement: 'static', desc: 'Reverse OTS on B, favouring A', fps: '24' },
      { scene: '1', category: 'detail', size: 'INS', angle: 'overhead', movement: 'static', desc: 'Note slid across the table', fps: '24' },
      { scene: '1', category: 'reaction', size: 'CU', angle: 'eye', movement: 'static', desc: 'A reads the note, beat of realisation', fps: '24' },
      { scene: '1', category: 'pov', size: 'MS', angle: 'pov', movement: 'handheld', desc: 'A’s POV of the door as a stranger enters', fps: '24' },
      { scene: '1', category: 'transition', size: 'WS', angle: 'eye', movement: 'whip', desc: 'Whip pan out to the next scene', fps: '24' }
    ]
  }
];

RB.find = (list, id) => list.find(x => x.id === id);
