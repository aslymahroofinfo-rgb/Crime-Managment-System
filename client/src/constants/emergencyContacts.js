/**
 * Authoritative Sri Lankan National Emergency Contacts
 * Single Source of Truth for CIW Platform
 */

export const PRIMARY_EMERGENCY_CONTACTS = [
  {
    id: 'police-119',
    name: 'Police Emergency',
    shortName: 'Police',
    number: '119',
    icon: 'bi-shield-fill-check',
    color: '#0d6efd',
    bgLight: 'rgba(13, 110, 253, 0.1)',
    badgeClass: 'bg-primary',
    callLabel: 'Call Police — 119',
    ariaLabel: 'Call Police Emergency 119',
    description: 'Immediate police intervention, active crime response & public distress'
  },
  {
    id: 'ambulance-1990',
    name: '1990 Suwa Seriya Emergency Ambulance',
    shortName: 'Suwa Seriya Ambulance',
    number: '1990',
    icon: 'bi-heart-pulse-fill',
    color: '#198754',
    bgLight: 'rgba(25, 135, 84, 0.1)',
    badgeClass: 'bg-success',
    callLabel: 'Call Ambulance — 1990',
    ariaLabel: 'Call 1990 Suwa Seriya Emergency Ambulance',
    description: 'Free island-wide pre-hospital medical emergency and paramedic dispatch'
  },
  {
    id: 'fire-110',
    name: 'Fire & Rescue',
    shortName: 'Fire & Rescue',
    number: '110',
    icon: 'bi-fire',
    color: '#dc3545',
    bgLight: 'rgba(220, 53, 69, 0.1)',
    badgeClass: 'bg-danger',
    callLabel: 'Call Fire & Rescue — 110',
    ariaLabel: 'Call Fire and Rescue 110',
    description: 'Municipal fire department dispatch, vehicle extrication & disaster rescue'
  }
];

export const SECONDARY_EMERGENCY_CONTACTS = [
  {
    id: 'dmc-117',
    name: 'Disaster Management Centre',
    number: '117',
    icon: 'bi-cloud-lightning-rain-fill',
    category: 'Disaster & Floods',
    callLabel: 'Call DMC — 117',
    ariaLabel: 'Call Disaster Management Centre 117'
  },
  {
    id: 'helpdesk-118',
    name: 'National Help Desk',
    number: '118',
    icon: 'bi-info-circle-fill',
    category: 'Public Assistance',
    callLabel: 'Call Help Desk — 118',
    ariaLabel: 'Call National Help Desk 118'
  },
  {
    id: 'women-1938',
    name: 'Women Helpline',
    number: '1938',
    icon: 'bi-gender-female',
    category: 'Women Safety',
    callLabel: 'Call Women Helpline — 1938',
    ariaLabel: 'Call Women Helpline 1938'
  },
  {
    id: 'child-1929',
    name: 'Child Helpline',
    number: '1929',
    icon: 'bi-person-hearts',
    category: 'Child Protection',
    callLabel: 'Call Child Helpline — 1929',
    ariaLabel: 'Call Child Helpline 1929'
  },
  {
    id: 'abuse-bureau-109',
    name: 'Child & Women Abuse Bureau',
    number: '109',
    icon: 'bi-shield-shaded',
    category: 'Abuse Investigation',
    callLabel: 'Call Bureau — 109',
    ariaLabel: 'Call Child and Women Abuse Bureau 109'
  },
  {
    id: 'tamil-107',
    name: 'Emergency Call Centre — Tamil',
    number: '107',
    icon: 'bi-translate',
    category: 'Tamil Language Desk',
    callLabel: 'Call Tamil Desk — 107',
    ariaLabel: 'Call Tamil Emergency Call Centre 107'
  },
  {
    id: 'expressway-1969',
    name: 'Expressway Emergency',
    number: '1969',
    icon: 'bi-signpost-split-fill',
    category: 'Highway & Tollway Rescue',
    callLabel: 'Call Expressway — 1969',
    ariaLabel: 'Call Expressway Emergency 1969'
  },
  {
    id: 'drug-crime-1997',
    name: 'Drug / Organized Crime Emergency',
    number: '1997',
    icon: 'bi-slash-circle-fill',
    category: 'Narcotics & Gang Triage',
    callLabel: 'Call Narcotics — 1997',
    ariaLabel: 'Call Drug and Organized Crime Emergency 1997'
  },
  {
    id: 'bribery-1954',
    name: 'Bribery / Corruption Commission',
    number: '1954',
    icon: 'bi-bank2',
    category: 'Anti-Corruption Hotline',
    callLabel: 'Call CIABOC — 1954',
    ariaLabel: 'Call Bribery and Corruption Commission 1954'
  },
  {
    id: 'gic-1919',
    name: 'Government Information Centre',
    number: '1919',
    icon: 'bi-building-fill',
    category: 'Citizen Services',
    callLabel: 'Call GIC — 1919',
    ariaLabel: 'Call Government Information Centre 1919'
  }
];

export const ALL_VERIFIED_EMERGENCY_NUMBERS = [
  ...PRIMARY_EMERGENCY_CONTACTS,
  ...SECONDARY_EMERGENCY_CONTACTS
];

export const EMERGENCY_ADVISORY = {
  title: 'Immediate Danger Advisory',
  message: 'If there is an immediate threat to life or safety, do not rely only on an online complaint.',
  primaryLines: [
    { label: 'Police Emergency', number: '119' },
    { label: '1990 Suwa Seriya Ambulance', number: '1990' },
    { label: 'Fire & Rescue', number: '110' }
  ]
};

