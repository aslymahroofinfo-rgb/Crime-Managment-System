const bcrypt = require('bcryptjs');

const mockUsers = [
  {
    id: 'admin-001',
    fullName: 'Super Administrator',
    email: 'admin@ccms.com',
    phoneNumber: '0000000000',
    nationalId: 'SUPER-ADMIN-001',
    address: {
      no: 'HQ',
      street: 'Central Station',
      city: 'Colombo',
      district: 'Colombo'
    },
    password: bcrypt.hashSync('Admin@123', 10),
    role: 'SuperAdmin',
    citizenId: 'CIW-ADMIN-0001',
    isActive: true
  },
  {
    id: 'admin-002',
    fullName: 'Station Officer Silva',
    email: 'officer@ccms.com',
    phoneNumber: '0773334455',
    nationalId: 'OFFICER-002',
    address: {
      no: '12',
      street: 'Station Road',
      city: 'Colombo',
      district: 'Colombo'
    },
    password: bcrypt.hashSync('Admin@123', 10),
    role: 'Admin',
    citizenId: 'CIW-ADMIN-0002',
    isActive: true
  },
  {
    id: 'citizen-john',
    fullName: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '0771112233',
    nationalId: '199812345678',
    address: {
      no: '12',
      street: 'Temple Road',
      city: 'Colombo',
      district: 'Colombo'
    },
    password: bcrypt.hashSync('Password123', 10),
    role: 'Citizen',
    citizenId: 'CIW-USER-01-0001',
    isActive: true
  },
  {
    id: 'citizen-alice',
    fullName: 'Alice Smith',
    email: 'alice@example.com',
    phoneNumber: '0772223344',
    nationalId: '199823456789',
    address: {
      no: '45',
      street: 'Lake View',
      city: 'Kandy',
      district: 'Kandy'
    },
    password: bcrypt.hashSync('Password123', 10),
    role: 'Citizen',
    citizenId: 'CIW-USER-04-0002',
    isActive: true
  },
  {
    id: 'citizen-bob',
    fullName: 'Bob Johnson',
    email: 'bob@example.com',
    phoneNumber: '0773334455',
    nationalId: '199834567890',
    address: {
      no: '8',
      street: 'Main Street',
      city: 'Galle',
      district: 'Galle'
    },
    password: bcrypt.hashSync('Password123', 10),
    role: 'Citizen',
    citizenId: 'CIW-USER-07-0003',
    isActive: true
  }
];

const mockComplaints = [
  {
    complaintId: 'CCMS-000001',
    userId: 'citizen-john',
    title: 'Bicycle theft from the front porch',
    category: 'Theft',
    district: 'Colombo',
    incidentDate: '2026-06-10T00:00:00.000Z',
    incidentTime: '14:30',
    location: 'Front Porch, 123 Temple Road',
    description: 'An expensive carbon fiber road bike was stolen from my front porch in broad daylight. The thief cut the chain and left no trace.',
    suspectDetails: 'Unknown suspect, likely a local youth seen around the area.',
    witnessDetails: 'One neighbour saw a man in a red hoodie near the gate.',
    evidenceFiles: [],
    isAnonymous: false,
    status: 'Resolved',
    statusHistory: [
      { status: 'Pending', changedAt: '2026-06-16T09:30:00.000Z', changedByRole: 'Citizen', note: 'Complaint filed' },
      { status: 'Approved', changedAt: '2026-06-17T10:00:00.000Z', changedByRole: 'Admin', changedByName: 'Station Officer Silva' },
      { status: 'Under Investigation', changedAt: '2026-06-18T14:00:00.000Z', changedByRole: 'Admin', changedByName: 'Station Officer Silva' },
      { status: 'Resolved', changedAt: '2026-06-22T16:30:00.000Z', changedByRole: 'Admin', changedByName: 'Station Officer Silva', note: 'Property recovered and case closed.' }
    ],
    createdAt: '2026-06-16T09:30:00.000Z'
  },
  {
    complaintId: 'CCMS-000002',
    userId: 'citizen-alice',
    title: 'Suspicious bank phishing email',
    category: 'Cyber Crime',
    district: 'Kandy',
    incidentDate: '2026-06-15T00:00:00.000Z',
    incidentTime: '09:15',
    location: 'Online',
    description: 'I received a fraudulent email pretending to be from my bank and entered my credentials. A small transfer was later detected in my account.',
    suspectDetails: 'Unknown sender using a fake bank domain.',
    witnessDetails: 'No direct witnesses; all reports were digital.',
    evidenceFiles: [],
    isAnonymous: false,
    status: 'Under Investigation',
    statusHistory: [
      { status: 'Pending', changedAt: '2026-06-18T11:20:00.000Z', changedByRole: 'Citizen', note: 'Complaint filed' },
      { status: 'Approved', changedAt: '2026-06-19T09:00:00.000Z', changedByRole: 'Admin' },
      { status: 'Under Investigation', changedAt: '2026-06-20T11:30:00.000Z', changedByRole: 'Admin', note: 'Assigned to Cyber Crime division' }
    ],
    createdAt: '2026-06-18T11:20:00.000Z'
  },
  {
    complaintId: 'CCMS-000003',
    userId: 'citizen-bob',
    title: 'Garage door vandalism',
    category: 'Other',
    district: 'Galle',
    incidentDate: '2026-06-16T00:00:00.000Z',
    incidentTime: '01:00',
    location: 'Garage, Main Street, Galle',
    description: 'Red spray paint was used to vandalize my garage door overnight. Two masked individuals were seen nearby at the time of the incident.',
    suspectDetails: 'Two masked individuals seen moving by a van.',
    witnessDetails: 'A neighbour heard a loud vehicle noise and saw two people nearby.',
    evidenceFiles: [],
    isAnonymous: false,
    status: 'Pending',
    statusHistory: [
      { status: 'Pending', changedAt: '2026-06-18T14:35:00.000Z', changedByRole: 'Citizen', note: 'Complaint filed' }
    ],
    createdAt: '2026-06-18T14:35:00.000Z'
  },
  {
    complaintId: 'CCMS-000004',
    userId: 'citizen-john',
    title: 'Motorcycle robbery outside the market',
    category: 'Robbery',
    district: 'Colombo',
    incidentDate: '2026-06-20T00:00:00.000Z',
    incidentTime: '19:10',
    location: 'Colombo Market Car Park',
    description: 'A motorcycle was stolen while I was purchasing groceries. The suspect ran away immediately after the theft.',
    suspectDetails: 'One male suspect wearing a black helmet.',
    witnessDetails: 'Two shop assistants witnessed the incident.',
    evidenceFiles: [],
    isAnonymous: false,
    status: 'Approved',
    statusHistory: [
      { status: 'Pending', changedAt: '2026-06-21T08:15:00.000Z', changedByRole: 'Citizen', note: 'Complaint filed' },
      { status: 'Approved', changedAt: '2026-06-22T10:00:00.000Z', changedByRole: 'Admin', note: 'Intake verified by officer' }
    ],
    createdAt: '2026-06-21T08:15:00.000Z'
  }
];

const findMockUserByEmail = (email) => mockUsers.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
const findMockUserById = (id) => mockUsers.find((user) => user.id === id);

let mockComplaintSeq = 0;

const getNextComplaintId = () => {
  const currentMax = mockComplaints.reduce((max, complaint) => {
    const current = Number(String(complaint.complaintId).split('-').pop() || '0');
    return Math.max(max, current);
  }, 0);

  mockComplaintSeq = Math.max(mockComplaintSeq, currentMax) + 1;
  return `CCMS-${String(mockComplaintSeq).padStart(6, '0')}`;
};

const mockContactInquiries = [
  {
    _id: 'inq-001',
    id: 'inq-001',
    name: 'Saman Perera',
    email: 'saman@example.com',
    phone: '0714455667',
    subject: 'Question regarding case reference status',
    message: 'Hello, I submitted a complaint last week but have not received an update. Could someone assist me with the status?',
    status: 'New',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    _id: 'inq-002',
    id: 'inq-002',
    name: 'Kavindi Silva',
    email: 'kavindi@example.com',
    phone: '',
    subject: 'Feedback on portal accessibility',
    message: 'The online filing system was easy to use. Thank you to the team for maintaining this public safety portal.',
    status: 'Read',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

const mockAuditLogs = [
  {
    _id: 'audit-001',
    id: 'audit-001',
    actor: 'admin-001',
    actorEmail: 'admin@ccms.com',
    actorRole: 'SuperAdmin',
    action: 'USER_LOGIN',
    entityType: 'Auth',
    entityId: 'admin-001',
    metadata: { method: 'JWT' },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    _id: 'audit-002',
    id: 'audit-002',
    actor: 'admin-002',
    actorEmail: 'officer@ccms.com',
    actorRole: 'Admin',
    action: 'COMPLAINT_STATUS_CHANGED',
    entityType: 'Complaint',
    entityId: 'CCMS-000001',
    metadata: { previousStatus: 'Under Investigation', newStatus: 'Resolved' },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

module.exports = {
  mockContactInquiries,
  mockUsers,
  mockComplaints,
  mockAuditLogs,
  findMockUserByEmail,
  findMockUserById,
  getNextComplaintId
};
