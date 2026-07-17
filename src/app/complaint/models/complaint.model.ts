export interface ComplaintImage {
  id: number;
  imageUrl: string;
  cloudId: string;
  timestamp: string;
}

export interface Complaint {
  id: number;
  userId: string;
  dispatcherId: string | null;
  adminId: string | null; // Stores Assigned Technician username
  hodId: string | null;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: string | null;
  upvoteCount: number;
  public: boolean;
  status: 'OPEN' | 'IN_PROGRESS' | 'VERIFICATION_PENDING' | 'RESOLVED' | 'REJECTED';
  adminNote: string | null;
  hodNote: string | null;
  createdAt: string;
  updatedAt: string;
  images: ComplaintImage[];
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}
