/* Job data model and the pick lists used by the forms and the report. */
(function (root) {
  'use strict';

  const CATEGORIES = [
    'Routine',
    'Non-routine – Simple / Basic',
    'Non-routine – Complicated',
    'Non-routine – Complex / Critical',
  ];

  const WEIGHT_SOURCES = [
    'Actual – weighed / load cell',
    'Nameplate / manufacturer data',
    'Drawing / datasheet',
    'Archived lift plan',
    'Estimated / calculated',
    'Unknown',
  ];

  const ITEM_TYPES = ['Pump', 'Motor', 'Valve', 'Spool', 'Vessel', 'Heat exchanger', 'Filter', 'Compressor part', 'Skid / package', 'Panel', 'Other'];

  const LOAD_FLAGS = [
    { id: 'fragile', label: 'Fragile, needs protection' },
    { id: 'highCog', label: 'High CoG or unstable' },
    { id: 'sharp', label: 'Sharp edges, packing needed' },
    { id: 'protrusion', label: 'Protrusions (e.g. shaft below)' },
    { id: 'fluids', label: 'May hold fluids or chemicals' },
    { id: 'awkward', label: 'Awkward size or shape' },
  ];

  const ATTACHMENT = [
    'Slung – no dedicated lifting points',
    'Certified pad eyes / lugs',
    'Eye bolts',
    'Trunnions',
    'Lifting beam / frame',
  ];

  const LP_TYPES = [
    'Scaffold lifting frame', 'Beam clamp', 'Pad eye', 'Runway beam / trolley', 'Monorail',
    'Davit', 'Crane hook', 'Lifting lug on load', 'Eye bolt on load', 'Sling around load', 'Other',
  ];

  const RIGGING_ITEMS = [
    'Chain block', 'Lever hoist', 'Bow shackle', 'Dee shackle', 'Endless round sling', 'Webbing sling',
    'Wire rope sling', 'Chain sling', 'Master link', 'Beam clamp', 'Beam trolley', 'Swivel',
    'Load cell', 'Tag line', 'Spreader beam',
  ];

  const RESPONSIBLE = ['Riggers', 'Mechanics', 'Mechanics / Riggers', 'Crane operator', 'Banksman', 'Work party', 'Supervisor'];

  const COLOUR_CODES = ['', 'Red', 'Yellow', 'Green', 'Blue', 'White', 'Orange', 'Brown', 'Black', 'Purple'];

  const COMMS = ['Radio', 'Verbal', 'Hand signals'];

  // Section 9 non-generic hazards.
  const HAZARDS = [
    { id: 'unverifiedWeight', label: 'Unverified weight of load' },
    { id: 'fragile', label: 'Fragile load needing extra protection during the lift or at lay down' },
    { id: 'highCog', label: 'Load has a high centre of gravity or is unstable' },
    { id: 'integrity', label: 'Potential for loss of load integrity' },
    { id: 'awkward', label: 'Load is an awkward size or shape, or has sharp edges' },
    { id: 'noLiftPoints', label: 'Load has no dedicated lifting points' },
    { id: 'noSuspension', label: 'No certified suspension points for cross hauling from the crane' },
    { id: 'chemicals', label: 'Lifting chemicals' },
    { id: 'headroom', label: 'Restricted headroom or confined work area' },
    { id: 'taglines', label: 'Tag lines needed, hands-free tools to be used' },
    { id: 'comms', label: 'Potential communication difficulties' },
    { id: 'livePlant', label: 'Lift path is over live process plant or hazardous materials' },
    { id: 'obstacles', label: 'Lift path is close to permanent or temporary obstacles' },
    { id: 'pickupObstructions', label: 'Obstructions in the pick up or lay down area' },
    { id: 'laydownArea', label: 'Lay down area is not big or strong enough' },
    { id: 'laydownRadius', label: 'Lay down area is outside the reach or radius of the lifting equipment' },
    { id: 'personnel', label: 'Non-essential personnel could enter the area below the lift' },
    { id: 'safeAreas', label: 'Safe areas identified, including ricochet and deflection hazards' },
  ];

  // Standard stage layout, as used on the LOLER lift plan.
  const STEP_TEMPLATE = [
    { type: 'stage', text: 'STAGE 1 – PRE-RIGGING AND SLINGING' },
    { type: 'step', text: 'Lifting points: ', who: 'Riggers' },
    { type: 'step', text: 'Slinging arrangement: ', who: 'Riggers' },
    { type: 'stage', text: 'STAGE 2 – REMOVE' },
    { type: 'step', text: 'Erect signs and barriers around the worksite', who: 'Riggers' },
    { type: 'step', text: 'Pre-rig the lifting points and attach the slinging arrangement as per Stage 1. Use packing on sharp edges.', who: 'Riggers' },
    { type: 'stage', text: 'STAGE 3 – RE-INSTALL' },
    { type: 'step', text: 'Erect signs and barriers around the worksite', who: 'Riggers' },
    { type: 'stage', text: 'STAGE 4 – DE-RIG AND TIDY WORKSITE' },
    {
      type: 'step',
      text: 'De-rig all rigging equipment and accessories. Tidy the worksite and remove all signs and barriers. Return all rigging to the rigging loft for post-use inspection. Record any defects in the defect register, quarantine the item and inform the LOLER Focal Point. Record any lessons learned.',
      who: 'Riggers / Work party',
    },
  ];

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function today() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function newJob(defaults = {}) {
    const now = Date.now();
    return {
      id: uid(),
      createdAt: now,
      updatedAt: now,
      syncedAt: 0,
      details: {
        name: '', liftPlanNo: '', workOrder: '', permitNo: '', raNo: '',
        location: defaults.location || '', area: '', author: defaults.author || '',
        date: today(), revision: 'REV0', category: CATEGORIES[0], description: '',
        comms: ['Radio', 'Verbal'], personnel: '', colourCode: '',
      },
      load: {
        tag: '', type: '', description: '', weightKg: null, weightSource: '', weightVerified: '',
        riggingKg: null, length: null, width: null, height: null, cog: '', attachment: '', flags: [], notes: '', photos: [],
      },
      liftingPoints: [],
      rigging: [],
      steps: [],
      calcs: [],
      photos: [],
      hazards: {},
      risk: { notes: '', controls: '', tbt: '' },
    };
  }

  function newLiftingPoint(role, index) {
    return {
      id: uid(),
      name: role === 'load' ? `AP${index}` : `LP${index}`,
      role, type: role === 'load' ? 'Sling around load' : '', swlKg: null,
      certNo: '', location: '', rigging: '', notes: '', photos: [],
    };
  }

  function newRiggingItem(item = '') {
    return { id: uid(), qty: 1, item, wll: null, wllUnit: 'te', length: null, notes: '' };
  }

  function wllKg(r) {
    if (r.wll == null || r.wll === '') return null;
    return r.wllUnit === 'kg' ? Number(r.wll) : Number(r.wll) * 1000;
  }

  // "2 x 500kg Chain Block 3m", in the same style as section 6.0 of the lift plan.
  function riggingLine(r) {
    const wll = r.wll != null && r.wll !== '' ? `${r.wll}${r.wllUnit === 'kg' ? 'kg' : 'te'} ` : '';
    const len = r.length != null && r.length !== '' ? ` ${r.length}m` : '';
    return `${r.qty || 1} x ${wll}${r.item || 'Item'}${len}${r.notes ? ` (${r.notes})` : ''}`;
  }

  function totalLoadKg(job) {
    const w = Number(job.load.weightKg) || 0;
    const r = Number(job.load.riggingKg) || 0;
    return w + r;
  }

  function fmtKg(kg) {
    if (kg == null || !isFinite(kg)) return '–';
    const t = kg / 1000;
    return `${Math.round(kg).toLocaleString('en-GB')} kg (${t >= 10 ? t.toFixed(1) : t.toFixed(2)} te)`;
  }

  // Everything the report and job list need to say whether a job still has gaps.
  function checks(job) {
    const out = [];
    const total = totalLoadKg(job);
    if (!job.load.weightKg) out.push({ level: 'caution', text: 'Load weight not entered.' });
    if (job.load.weightKg && job.load.weightVerified === 'no') {
      out.push({ level: 'caution', text: 'Load weight is not verified. Consider a load cell or add a margin.' });
    }
    job.liftingPoints.forEach((lp) => {
      if (lp.role !== 'suspension') return;
      if (!lp.swlKg) out.push({ level: 'caution', text: `${lp.name || 'Lifting point'}: SWL not entered.` });
      else if (total && Number(lp.swlKg) < total) {
        out.push({ level: 'danger', text: `${lp.name}: SWL ${fmtKg(Number(lp.swlKg))} is less than the load ${fmtKg(total)}.` });
      }
    });
    job.rigging.forEach((r) => {
      const w = wllKg(r);
      if (w && total && w < total && /chain block|lever hoist|master link|shackle|swivel|trolley|clamp/i.test(r.item)) {
        out.push({ level: 'caution', text: `${riggingLine(r)}: WLL is below the total load. Check it is not taking the full load.` });
      }
    });
    return out;
  }

  root.LiftModel = {
    CATEGORIES, WEIGHT_SOURCES, ITEM_TYPES, LOAD_FLAGS, ATTACHMENT, LP_TYPES, RIGGING_ITEMS,
    RESPONSIBLE, COLOUR_CODES, COMMS, HAZARDS, STEP_TEMPLATE,
    uid, today, newJob, newLiftingPoint, newRiggingItem, wllKg, riggingLine, totalLoadKg, fmtKg, checks,
  };
})(self);
