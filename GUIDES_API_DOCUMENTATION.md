# Guides API Documentation

## Overview
This comprehensive API documentation covers all guide-related endpoints for use in guide hiring, package creation, and booking functionality. The API supports guide search, booking, ratings, and seamless integration with travel packages.

## Base Configuration

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://wander-nest-ad3s.onrender.com/api";

// Authentication
const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};
```

## Data Types & Interfaces

### Core Guide Types

```typescript
export interface Guide {
  id: string | number;
  name: string;
  description: string;
  image: string;
  price: number;
  hourly_rate?: number;
  daily_rate?: number;
  currency: string;
  area: string;
  specialties: string[];
  languages: string[];
  experience_years: number;
  rating: number;
  total_reviews: number;
  availability: boolean;
  contact_info: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  location: {
    city: string;
    region: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  services_offered: string[];
  certifications?: string[];
  schedule?: {
    working_hours: string;
    available_days: string[];
    timezone: string;
  };
  pricing_details: {
    base_rate: number;
    group_discounts?: {
      min_group_size: number;
      discount_percentage: number;
    }[];
    package_rates?: {
      half_day: number;
      full_day: number;
      multi_day: number;
    };
  };
  gallery?: string[];
  badges?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface GuideSearchParams {
  location?: string;
  area?: string;
  specialties?: string[];
  languages?: string[];
  max_price?: number;
  min_rating?: number;
  experience_years?: number;
  availability_date?: string;
  services?: string[];
  sort_by?: "price" | "rating" | "experience" | "reviews" | "distance";
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface GuideSearchResponse {
  success: boolean;
  data: {
    guides: Guide[];
    total_results: number;
    page: number;
    total_pages: number;
    filters_applied: GuideSearchParams;
  };
  message: string;
}

export interface GuideBookingData {
  guide_id: string;
  service_type: "hourly" | "daily" | "package" | "tour";
  booking_date: string;
  start_time?: string;
  end_time?: string;
  duration_hours?: number;
  duration_days?: number;
  group_size: number;
  total_price: number;
  contact_email: string;
  contact_phone: string;
  special_requests?: string;
  meeting_point?: string;
  tour_details?: {
    destinations: string[];
    activities: string[];
    preferences: string[];
  };
  user_id?: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  payment_status: "pending" | "completed" | "failed";
}

export interface GuideBookingResponse {
  success: boolean;
  data: {
    booking_id: string;
    booking_reference: string;
    status: string;
    guide_details: Guide;
    service_details: {
      service_type: string;
      date: string;
      duration: string;
      meeting_point: string;
    };
    total_amount: number;
    payment_status: string;
    confirmation_details?: {
      guide_contact: string;
      emergency_contact: string;
      meeting_instructions: string;
    };
  };
  message: string;
}

export interface GuideReview {
  id: string;
  guide_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  service_type: string;
  booking_date: string;
  helpful_votes: number;
  verified_booking: boolean;
  created_at: string;
  images?: string[];
}

export interface GuideAvailability {
  guide_id: string;
  date: string;
  available_slots: {
    start_time: string;
    end_time: string;
    service_type: string;
    max_group_size: number;
    price: number;
  }[];
  booked_slots: {
    start_time: string;
    end_time: string;
    booking_id: string;
  }[];
  unavailable_periods?: {
    start_time: string;
    end_time: string;
    reason: string;
  }[];
}
```

### Package Integration Types

```typescript
export interface PackageGuideSelection {
  guide_id: string;
  guide_option: Guide;
  selected_for_package: boolean;
  package_id?: string;
  estimated_cost: number;
  service_duration: string;
  included_services: string[];
}

export interface GuideRecommendation {
  guide: Guide;
  match_score: number;
  reasons: string[];
  estimated_cost: number;
  availability_status: "available" | "limited" | "unavailable";
}

export interface LocationGuideAnalysis {
  location: string;
  available_guides: Guide[];
  recommended_guides: GuideRecommendation[];
  specialties_available: string[];
  price_range: {
    min: number;
    max: number;
    average: number;
  };
  popular_services: string[];
}
```

## API Endpoints

### 1. Guide Search & Discovery

#### Get All Guides
```http
GET /api/guides/
```

**Query Parameters:**
- `location` (optional): Filter by location/area
- `specialties` (optional): Filter by specialties (comma-separated)
- `languages` (optional): Filter by languages (comma-separated)
- `max_price` (optional): Maximum price filter
- `min_rating` (optional): Minimum rating filter
- `page` (optional): Page number for pagination
- `limit` (optional): Results per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "guides": [
      {
        "id": "guide_001",
        "name": "Ahmed Rahman",
        "description": "Expert local guide with 10+ years experience in cultural tours",
        "image": "/guides/ahmed_rahman.jpg",
        "price": 2500,
        "hourly_rate": 300,
        "daily_rate": 2500,
        "currency": "BDT",
        "area": "Dhaka & Surroundings",
        "specialties": ["Cultural Tours", "Historical Sites", "Food Tours"],
        "languages": ["Bengali", "English", "Hindi"],
        "experience_years": 12,
        "rating": 4.8,
        "total_reviews": 156,
        "availability": true,
        "contact_info": {
          "phone": "+880-123-456789",
          "email": "ahmed.guide@email.com",
          "whatsapp": "+880-123-456789"
        },
        "location": {
          "city": "Dhaka",
          "region": "Dhaka Division",
          "country": "Bangladesh"
        },
        "services_offered": [
          "City Tours",
          "Historical Site Visits",
          "Cultural Experiences",
          "Photography Assistance",
          "Language Translation"
        ],
        "schedule": {
          "working_hours": "8:00 AM - 6:00 PM",
          "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "timezone": "Asia/Dhaka"
        },
        "pricing_details": {
          "base_rate": 2500,
          "group_discounts": [
            {
              "min_group_size": 5,
              "discount_percentage": 10
            },
            {
              "min_group_size": 10,
              "discount_percentage": 20
            }
          ],
          "package_rates": {
            "half_day": 1500,
            "full_day": 2500,
            "multi_day": 2200
          }
        },
        "badges": ["Top Rated", "Local Expert", "Cultural Specialist"]
      }
    ],
    "total_results": 45,
    "page": 1,
    "total_pages": 3
  },
  "message": "Guides retrieved successfully"
}
```

#### Search Guides
```http
POST /api/guides/search/
```

**Request Body:**
```json
{
  "location": "Dhaka",
  "specialties": ["Cultural Tours", "Historical Sites"],
  "languages": ["English"],
  "max_price": 3000,
  "min_rating": 4.0,
  "availability_date": "2024-12-15",
  "services": ["City Tours", "Photography Assistance"],
  "sort_by": "rating",
  "sort_order": "desc"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "guides": [...],
    "total_results": 12,
    "page": 1,
    "total_pages": 1,
    "filters_applied": {
      "location": "Dhaka",
      "specialties": ["Cultural Tours", "Historical Sites"],
      "min_rating": 4.0
    }
  },
  "message": "Search completed successfully"
}
```

#### Get Guide Details
```http
GET /api/guides/{guide_id}/
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "guide_001",
    "name": "Ahmed Rahman",
    "description": "Expert local guide with 10+ years experience in cultural tours",
    "image": "/guides/ahmed_rahman.jpg",
    "price": 2500,
    "hourly_rate": 300,
    "daily_rate": 2500,
    "currency": "BDT",
    "area": "Dhaka & Surroundings",
    "specialties": ["Cultural Tours", "Historical Sites", "Food Tours"],
    "languages": ["Bengali", "English", "Hindi"],
    "experience_years": 12,
    "rating": 4.8,
    "total_reviews": 156,
    "availability": true,
    "contact_info": {
      "phone": "+880-123-456789",
      "email": "ahmed.guide@email.com",
      "whatsapp": "+880-123-456789"
    },
    "location": {
      "city": "Dhaka",
      "region": "Dhaka Division",
      "country": "Bangladesh",
      "coordinates": {
        "latitude": 23.8103,
        "longitude": 90.4125
      }
    },
    "services_offered": [
      "City Tours",
      "Historical Site Visits",
      "Cultural Experiences",
      "Photography Assistance",
      "Language Translation"
    ],
    "certifications": [
      "Licensed Tour Guide - Bangladesh Tourism Board",
      "First Aid Certified",
      "Heritage Site Specialist"
    ],
    "schedule": {
      "working_hours": "8:00 AM - 6:00 PM",
      "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "timezone": "Asia/Dhaka"
    },
    "pricing_details": {
      "base_rate": 2500,
      "group_discounts": [
        {
          "min_group_size": 5,
          "discount_percentage": 10
        }
      ],
      "package_rates": {
        "half_day": 1500,
        "full_day": 2500,
        "multi_day": 2200
      }
    },
    "gallery": [
      "/guides/ahmed_gallery1.jpg",
      "/guides/ahmed_gallery2.jpg"
    ],
    "badges": ["Top Rated", "Local Expert", "Cultural Specialist"]
  },
  "message": "Guide details retrieved successfully"
}
```

#### Get Guide Availability
```http
GET /api/guides/{guide_id}/availability/
```

**Query Parameters:**
- `date` (required): Date to check availability (YYYY-MM-DD)
- `days` (optional): Number of days to check (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "guide_id": "guide_001",
    "date": "2024-12-15",
    "available_slots": [
      {
        "start_time": "09:00",
        "end_time": "13:00",
        "service_type": "half_day",
        "max_group_size": 8,
        "price": 1500
      },
      {
        "start_time": "14:00",
        "end_time": "18:00",
        "service_type": "half_day",
        "max_group_size": 8,
        "price": 1500
      }
    ],
    "booked_slots": [
      {
        "start_time": "09:00",
        "end_time": "13:00",
        "booking_id": "booking_123"
      }
    ],
    "unavailable_periods": []
  },
  "message": "Availability retrieved successfully"
}
```

### 2. Guide Booking

#### Create Guide Booking
```http
POST /api/guides/bookings/
```

**Request Body:**
```json
{
  "guide_id": "guide_001",
  "service_type": "daily",
  "booking_date": "2024-12-15",
  "start_time": "09:00",
  "end_time": "18:00",
  "duration_hours": 9,
  "group_size": 4,
  "total_price": 2500,
  "contact_email": "john.doe@email.com",
  "contact_phone": "+880-987-654321",
  "special_requests": "Interested in historical sites and local cuisine",
  "meeting_point": "Hotel Dhaka Regency Lobby",
  "tour_details": {
    "destinations": ["Lalbagh Fort", "Ahsan Manzil", "Sadarghat"],
    "activities": ["Historical Tours", "Photography", "Local Food Tasting"],
    "preferences": ["Walking tours preferred", "English speaking guide"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": "GDB-001",
    "booking_reference": "AR-20241215-001",
    "status": "confirmed",
    "guide_details": {
      "id": "guide_001",
      "name": "Ahmed Rahman",
      "contact": "+880-123-456789",
      "rating": 4.8
    },
    "service_details": {
      "service_type": "daily",
      "date": "2024-12-15",
      "duration": "9 hours",
      "meeting_point": "Hotel Dhaka Regency Lobby"
    },
    "total_amount": 2500,
    "payment_status": "pending",
    "confirmation_details": {
      "guide_contact": "+880-123-456789",
      "emergency_contact": "+880-911",
      "meeting_instructions": "Guide will be waiting in the hotel lobby with a WanderNest sign"
    }
  },
  "message": "Booking created successfully"
}
```

#### Get User's Guide Bookings
```http
GET /api/guides/bookings/my-bookings/
```

**Query Parameters:**
- `status` (optional): Filter by booking status
- `date_from` (optional): Filter bookings from date
- `date_to` (optional): Filter bookings to date

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "booking_id": "GDB-001",
        "booking_reference": "AR-20241215-001",
        "status": "confirmed",
        "guide_details": {
          "name": "Ahmed Rahman",
          "rating": 4.8,
          "image": "/guides/ahmed_rahman.jpg"
        },
        "service_details": {
          "service_type": "daily",
          "date": "2024-12-15",
          "duration": "9 hours"
        },
        "total_amount": 2500,
        "created_at": "2024-12-01T10:00:00Z"
      }
    ],
    "total_bookings": 3
  },
  "message": "Bookings retrieved successfully"
}
```

#### Get Booking Details
```http
GET /api/guides/bookings/{booking_id}/
```

#### Update Booking
```http
PATCH /api/guides/bookings/{booking_id}/
```

#### Cancel Booking
```http
DELETE /api/guides/bookings/{booking_id}/
```

### 3. Guide Reviews & Ratings

#### Get Guide Reviews
```http
GET /api/guides/{guide_id}/reviews/
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Reviews per page
- `sort_by` (optional): Sort by rating, date, helpful_votes

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review_001",
        "guide_id": "guide_001",
        "user_id": "user_123",
        "user_name": "John Doe",
        "user_avatar": "/avatars/john.jpg",
        "rating": 5,
        "comment": "Ahmed was an excellent guide! Very knowledgeable about Dhaka's history and took us to amazing local food spots.",
        "service_type": "daily",
        "booking_date": "2024-11-15",
        "helpful_votes": 12,
        "verified_booking": true,
        "created_at": "2024-11-16T10:30:00Z",
        "images": ["/reviews/review_001_1.jpg"]
      }
    ],
    "total_reviews": 156,
    "average_rating": 4.8,
    "rating_distribution": {
      "5": 120,
      "4": 25,
      "3": 8,
      "2": 2,
      "1": 1
    }
  },
  "message": "Reviews retrieved successfully"
}
```

#### Create Review
```http
POST /api/guides/{guide_id}/reviews/
```

**Request Body:**
```json
{
  "booking_id": "GDB-001",
  "rating": 5,
  "comment": "Excellent guide with great local knowledge!",
  "service_type": "daily",
  "images": ["review_image_1.jpg", "review_image_2.jpg"]
}
```

### 4. Package Integration Endpoints

#### Get Guides for Package
```http
GET /api/packages/guide-options/
```

**Query Parameters:**
- `location` (optional): Package destination
- `package_type` (optional): Type of package (cultural, adventure, luxury)
- `budget_range` (optional): Price range filter
- `duration` (optional): Package duration in days

**Response:**
```json
{
  "success": true,
  "data": {
    "guide_options": [
      {
        "id": "guide_001",
        "name": "Ahmed Rahman",
        "description": "Expert local guide with 10+ years experience in cultural tours",
        "image": "/guides/ahmed_rahman.jpg",
        "price": 2500,
        "area": "Dhaka & Surroundings",
        "specialties": ["Cultural Tours", "Historical Sites", "Food Tours"],
        "rating": 4.8,
        "total_reviews": 156,
        "suitable_for_packages": true,
        "package_discount": 15,
        "estimated_duration": "Full day",
        "included_services": [
          "City tours",
          "Historical site visits",
          "Photography assistance",
          "Language translation"
        ]
      }
    ]
  },
  "message": "Package guide options retrieved successfully"
}
```

#### Analyze Location for Guides
```http
POST /api/packages/analyze-location-guides/
```

**Request Body:**
```json
{
  "location": "Dhaka",
  "package_type": "cultural",
  "duration_days": 3,
  "group_size": 4,
  "budget": 10000,
  "preferences": {
    "interests": ["history", "food", "photography"],
    "languages": ["English"],
    "experience_level": "expert"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "location": "Dhaka",
    "available_guides": [...],
    "recommended_guides": [
      {
        "guide": {
          "id": "guide_001",
          "name": "Ahmed Rahman",
          "rating": 4.8,
          "specialties": ["Cultural Tours", "Historical Sites"]
        },
        "match_score": 95,
        "reasons": [
          "Perfect specialty match for cultural tours",
          "Excellent rating and reviews",
          "Available for your dates",
          "Within budget range"
        ],
        "estimated_cost": 7500,
        "availability_status": "available"
      }
    ],
    "specialties_available": [
      "Cultural Tours",
      "Historical Sites",
      "Food Tours",
      "Adventure Tours",
      "Photography Tours"
    ],
    "price_range": {
      "min": 1500,
      "max": 5000,
      "average": 2800
    },
    "popular_services": [
      "City Tours",
      "Historical Site Visits",
      "Food Tours",
      "Photography Assistance"
    ]
  },
  "message": "Location guide analysis completed successfully"
}
```

### 5. Guide Management (For Guide Dashboard)

#### Get Guide Profile
```http
GET /api/guides/profile/
```

#### Update Guide Profile
```http
PATCH /api/guides/profile/
```

#### Update Guide Availability
```http
PATCH /api/guides/availability/
```

#### Get Guide Earnings
```http
GET /api/guides/earnings/
```

## TypeScript API Service Implementation

### Guide API Service Class

```typescript
export class GuideAPI {
  private static baseURL = API_BASE_URL;

  // Get all guides
  static async getGuides(params?: GuideSearchParams): Promise<GuideSearchResponse> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const endpoint = `/guides/${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest(endpoint);
  }

  // Search guides
  static async searchGuides(searchParams: GuideSearchParams): Promise<GuideSearchResponse> {
    return await apiRequest('/guides/search/', {
      method: 'POST',
      body: JSON.stringify(searchParams),
    });
  }

  // Get guide details
  static async getGuideDetails(guideId: string): Promise<{ success: boolean; data: Guide; message: string }> {
    return await apiRequest(`/guides/${guideId}/`);
  }

  // Get guide availability
  static async getGuideAvailability(
    guideId: string, 
    params: { date: string; days?: number }
  ): Promise<{ success: boolean; data: GuideAvailability; message: string }> {
    const queryString = new URLSearchParams(params as any).toString();
    return await apiRequest(`/guides/${guideId}/availability/?${queryString}`);
  }

  // Create booking
  static async createBooking(bookingData: GuideBookingData): Promise<GuideBookingResponse> {
    return await apiRequest('/guides/bookings/', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  // Get user bookings
  static async getUserBookings(filters?: { 
    status?: string; 
    date_from?: string; 
    date_to?: string 
  }): Promise<any> {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = `/guides/bookings/my-bookings/${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest(endpoint);
  }

  // Get booking details
  static async getBookingDetails(bookingId: string): Promise<any> {
    return await apiRequest(`/guides/bookings/${bookingId}/`);
  }

  // Update booking
  static async updateBooking(bookingId: string, updateData: Partial<GuideBookingData>): Promise<any> {
    return await apiRequest(`/guides/bookings/${bookingId}/`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  // Cancel booking
  static async cancelBooking(bookingId: string): Promise<any> {
    return await apiRequest(`/guides/bookings/${bookingId}/`, {
      method: 'DELETE',
    });
  }

  // Reviews
  static async getGuideReviews(
    guideId: string, 
    params?: { page?: number; limit?: number; sort_by?: string }
  ): Promise<any> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const endpoint = `/guides/${guideId}/reviews/${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest(endpoint);
  }

  static async createReview(guideId: string, reviewData: any): Promise<any> {
    return await apiRequest(`/guides/${guideId}/reviews/`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Package integration methods
  static async getPackageGuideOptions(filters?: any): Promise<any> {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = `/packages/guide-options/${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest(endpoint);
  }

  static async analyzeLocationGuides(locationData: any): Promise<LocationGuideAnalysis> {
    return await apiRequest('/packages/analyze-location-guides/', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  // Guide management (for guide dashboard)
  static async getGuideProfile(): Promise<any> {
    return await apiRequest('/guides/profile/');
  }

  static async updateGuideProfile(profileData: Partial<Guide>): Promise<any> {
    return await apiRequest('/guides/profile/', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  static async updateGuideAvailability(availabilityData: any): Promise<any> {
    return await apiRequest('/guides/availability/', {
      method: 'PATCH',
      body: JSON.stringify(availabilityData),
    });
  }

  static async getGuideEarnings(params?: { from_date?: string; to_date?: string }): Promise<any> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/guides/earnings/${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest(endpoint);
  }
}
```

## Usage Examples

### For All Guides Page

```typescript
// In AllGuides component
import { GuideAPI } from '../api/guides';

const AllGuides: React.FC = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<GuideSearchParams>({});

  // Load guides
  useEffect(() => {
    const loadGuides = async () => {
      setLoading(true);
      try {
        const response = await GuideAPI.getGuides({
          ...filters,
          page: 1,
          limit: 20
        });
        
        if (response.success) {
          setGuides(response.data.guides);
        }
      } catch (error) {
        console.error('Failed to load guides:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGuides();
  }, [filters]);

  // Search function
  const handleSearch = async (searchTerm: string) => {
    setLoading(true);
    try {
      const response = await GuideAPI.searchGuides({
        location: searchTerm,
        sort_by: 'rating',
        sort_order: 'desc'
      });
      
      if (response.success) {
        setGuides(response.data.guides);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Book guide
  const handleBookGuide = async (guideId: string, bookingData: any) => {
    try {
      const response = await GuideAPI.createBooking({
        guide_id: guideId,
        service_type: 'daily',
        booking_date: bookingData.date,
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
        group_size: bookingData.groupSize,
        total_price: bookingData.totalPrice,
        contact_email: bookingData.email,
        contact_phone: bookingData.phone,
        meeting_point: bookingData.meetingPoint,
        status: 'pending',
        payment_status: 'pending'
      });
      
      if (response.success) {
        alert(`Guide booked successfully! Reference: ${response.data.booking_reference}`);
      }
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please try again.');
    }
  };

  return (
    // Component JSX...
  );
};
```

### For Package Creation

```typescript
// In CreatePackages component
import { GuideAPI } from '../api/guides';

const CreatePackages: React.FC = () => {
  const [packageGuides, setPackageGuides] = useState<Guide[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [guideRecommendations, setGuideRecommendations] = useState<GuideRecommendation[]>([]);

  // Load package-specific guide options
  const loadPackageGuides = async (location: string, packageType: string) => {
    try {
      const response = await GuideAPI.getPackageGuideOptions({
        location: location,
        package_type: packageType,
        suitable_for_packages: true
      });

      if (response.success) {
        setPackageGuides(response.data.guide_options);
      }
    } catch (error) {
      console.error('Failed to load package guides:', error);
    }
  };

  // Get guide recommendations for location
  const analyzeLocationGuides = async (
    location: string, 
    packageType: string, 
    duration: number, 
    groupSize: number,
    budget: number
  ) => {
    try {
      const response = await GuideAPI.analyzeLocationGuides({
        location: location,
        package_type: packageType,
        duration_days: duration,
        group_size: groupSize,
        budget: budget,
        preferences: {
          interests: ['history', 'culture'],
          languages: ['English'],
          experience_level: 'expert'
        }
      });

      if (response.success) {
        setGuideRecommendations(response.data.recommended_guides);
        // Auto-select top recommended guide
        if (response.data.recommended_guides.length > 0) {
          setSelectedGuide(response.data.recommended_guides[0].guide.id);
        }
      }
    } catch (error) {
      console.error('Guide analysis failed:', error);
    }
  };

  // Create package with selected guide
  const createPackageWithGuide = async (packageData: any) => {
    try {
      const packagePayload = {
        ...packageData,
        guide_id: selectedGuide,
        estimated_guide_cost: packageGuides.find(g => g.id === selectedGuide)?.price || 0
      };

      // Call package creation API
      const response = await packageAPI.createPackage(packagePayload);
      
      if (response.success) {
        navigate('/packages/confirm', { state: { package: response.data } });
      }
    } catch (error) {
      console.error('Package creation failed:', error);
    }
  };

  return (
    // Component JSX...
  );
};
```

### For Package Booking Confirmation

```typescript
// In confirm_book component
import { GuideAPI } from '../api/guides';

const ConfirmBook: React.FC = () => {
  const [packageDetails, setPackageDetails] = useState<any>(null);
  const [guideDetails, setGuideDetails] = useState<Guide | null>(null);
  const [guideAvailability, setGuideAvailability] = useState<GuideAvailability | null>(null);

  // Load guide details for the package
  useEffect(() => {
    const loadGuideDetails = async () => {
      if (packageDetails?.guide_id) {
        try {
          const [guideResponse, availabilityResponse] = await Promise.all([
            GuideAPI.getGuideDetails(packageDetails.guide_id),
            GuideAPI.getGuideAvailability(packageDetails.guide_id, {
              date: packageDetails.start_date
            })
          ]);
          
          if (guideResponse.success) {
            setGuideDetails(guideResponse.data);
          }
          
          if (availabilityResponse.success) {
            setGuideAvailability(availabilityResponse.data);
          }
        } catch (error) {
          console.error('Failed to load guide details:', error);
        }
      }
    };

    loadGuideDetails();
  }, [packageDetails]);

  // Confirm booking with guide
  const confirmBooking = async (travelerDetails: any[]) => {
    try {
      // Create guide booking as part of package
      if (packageDetails.guide_id) {
        const guideBooking = await GuideAPI.createBooking({
          guide_id: packageDetails.guide_id,
          service_type: 'package',
          booking_date: packageDetails.start_date,
          start_time: '09:00',
          end_time: '18:00',
          duration_days: packageDetails.duration_days,
          group_size: travelerDetails.length,
          total_price: guideDetails?.price || 0,
          contact_email: travelerDetails[0].email,
          contact_phone: travelerDetails[0].phone,
          meeting_point: packageDetails.meeting_point || 'Hotel lobby',
          tour_details: {
            destinations: packageDetails.destinations || [],
            activities: packageDetails.activities || [],
            preferences: packageDetails.preferences || []
          },
          status: 'pending',
          payment_status: 'pending'
        });

        if (guideBooking.success) {
          // Update package with guide booking reference
          await packageAPI.updatePackage(packageDetails.id, {
            guide_booking_reference: guideBooking.data.booking_reference,
            status: 'confirmed'
          });
        }
      }

      alert('Package booking confirmed with guide!');
    } catch (error) {
      console.error('Booking confirmation failed:', error);
    }
  };

  return (
    // Component JSX...
  );
};
```

### For Guide Reviews

```typescript
// Guide reviews component
import { GuideAPI } from '../api/guides';

const GuideReviews: React.FC<{ guideId: string }> = ({ guideId }) => {
  const [reviews, setReviews] = useState<GuideReview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      try {
        const response = await GuideAPI.getGuideReviews(guideId, {
          page: 1,
          limit: 10,
          sort_by: 'date'
        });
        
        if (response.success) {
          setReviews(response.data.reviews);
        }
      } catch (error) {
        console.error('Failed to load reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [guideId]);

  const submitReview = async (reviewData: any) => {
    try {
      const response = await GuideAPI.createReview(guideId, reviewData);
      
      if (response.success) {
        // Reload reviews
        setReviews([response.data, ...reviews]);
        alert('Review submitted successfully!');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  return (
    // Component JSX...
  );
};
```

## Error Handling

```typescript
// Custom error types for guide API
export class GuideAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorType: 'NETWORK' | 'VALIDATION' | 'AUTHENTICATION' | 'BOOKING_CONFLICT' | 'SERVER'
  ) {
    super(message);
    this.name = 'GuideAPIError';
  }
}

// Enhanced error handling
const handleGuideAPIError = (error: any): GuideAPIError => {
  if (error.response) {
    switch (error.response.status) {
      case 400:
        return new GuideAPIError('Invalid request parameters', 400, 'VALIDATION');
      case 401:
        return new GuideAPIError('Authentication required', 401, 'AUTHENTICATION');
      case 404:
        return new GuideAPIError('Guide not found', 404, 'VALIDATION');
      case 409:
        return new GuideAPIError('Guide not available for selected time', 409, 'BOOKING_CONFLICT');
      case 500:
        return new GuideAPIError('Server error occurred', 500, 'SERVER');
      default:
        return new GuideAPIError(`Request failed with status ${error.response.status}`, error.response.status, 'SERVER');
    }
  } else if (error.request) {
    return new GuideAPIError('Network connection failed', 0, 'NETWORK');
  } else {
    return new GuideAPIError(error.message || 'Unknown error occurred', 0, 'SERVER');
  }
};
```

## Integration Checklist

### For All Guides Page:
- [ ] Display guides with filtering by location, specialty, price
- [ ] Search functionality across guide profiles
- [ ] Guide detail modals with reviews and ratings
- [ ] Direct booking capability
- [ ] Availability checking
- [ ] Contact guide functionality

### For Package Creation:
- [ ] Guide selection for packages
- [ ] Location-based guide recommendations
- [ ] Cost estimation integration
- [ ] Guide specialties matching package type
- [ ] Package guide preferences

### For Package Booking:
- [ ] Guide details in package confirmation
- [ ] Combined booking flow
- [ ] Guide booking as part of package
- [ ] Meeting point coordination
- [ ] Emergency contact information

### For Guide Management:
- [ ] Guide profile management
- [ ] Availability calendar
- [ ] Booking management
- [ ] Earnings tracking
- [ ] Review management

This comprehensive API documentation provides everything needed to implement robust guide functionality across your application, with seamless integration between standalone guide hiring and package creation/booking workflows.