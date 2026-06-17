export type UserRole = 'admin' | 'engineer';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  photoURL?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Landlord {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Property {
  id: string;
  address: string;
  postcode: string;
  ownerId: string;
  ownerType: 'client' | 'landlord';
  lastMaintenanceDate?: string;
  nextMaintenanceDue?: string;
}

export type JobStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface Job {
  id: string;
  propertyId: string;
  engineerId: string;
  title: string;
  description: string;
  status: JobStatus;
  startTime: string;
  endTime: string;
  calendarEventId?: string;
  createdAt: string;
}

export interface GasSafetyData {
  applianceDetails: {
    location: string;
    type: string;
    make: string;
    model: string;
    ownedBy: 'landlord' | 'tenant';
    inspected: boolean;
    pass: boolean;
  }[];
  engineerComment: string;
  landlordConfirmed: boolean;
}

export interface Certificate {
  id: string;
  jobId: string;
  propertyId: string;
  engineerId: string;
  data: GasSafetyData;
  issuedAt: string;
  pdfUrl?: string;
}
