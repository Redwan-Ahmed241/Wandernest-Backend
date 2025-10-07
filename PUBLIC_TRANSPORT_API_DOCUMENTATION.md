# Public Transport API Documentation

## Overview
This comprehensive API documentation covers all public transport endpoints for use in both the Public Transport page and Package creation/booking functionality. The API follows RESTful principles and supports real-time transport data, bookings, and integration with travel packages.

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

### Core Transport Types

```typescript
export interface TransportOption {
  id: string | number;
  type: "Bus" | "Metro" | "Train" | "Ferry" | "Boat" | "Car" | "Flight";
  name: string;
  route: string;
  from_location: string;
  to_location: string;
  frequency: string;
  price: string | number;
  currency: string;
  image: string;
  features: string[];
  rating?: number;
  availability: boolean;
  operator: string;
  contact_info?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  schedule?: {
    departure_times: string[];
    duration: string;
    stops?: string[];
  };
  amenities?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface TransportSearchParams {
  from?: string;
  to?: string;
  transport_type?: "all" | "bus" | "metro" | "train" | "ferry" | "boat" | "car" | "flight";
  date?: string;
  passengers?: number;
  max_price?: number;
  features?: string[];
  sort_by?: "price" | "duration" | "rating" | "departure_time";
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface TransportSearchResponse {
  success: boolean;
  data: {
    transports: TransportOption[];
    total_results: number;
    page: number;
    total_pages: number;
    filters_applied: TransportSearchParams;
  };
  message: string;
}

export interface TransportBookingData {
  transport_id: string;
  passengers: PassengerInfo[];
  travel_date: string;
  contact_email: string;
  contact_phone: string;
  special_requests?: string;
  total_price: number;
  booking_date: string;
  user_id?: string;
  status: "pending" | "confirmed" | "cancelled";
}

export interface PassengerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  idNumber?: string;
  seat_preference?: string;
}

export interface TransportBookingResponse {
  success: boolean;
  data: {
    booking_id: string;
    booking_reference: string;
    status: string;
    transport_details: TransportOption;
    passengers: PassengerInfo[];
    total_amount: number;
    payment_status: "pending" | "completed" | "failed";
  };
  message: string;
}
```

### Package Integration Types

```typescript
export interface PackageTransportSelection {
  transport_id: string;
  transport_option: TransportOption;
  selected_for_package: boolean;
  package_id?: string;
  estimated_cost: number;
}

export interface RouteAnalysis {
  from_location: string;
  to_location: string;
  distance: number;
  estimated_duration: string;
  available_transports: TransportOption[];
  recommended_transport: TransportOption;
  cost_comparison: {
    cheapest: TransportOption;
    fastest: TransportOption;
    most_comfortable: TransportOption;
  };
}
```

## API Endpoints

### 1. Transport Search & Discovery

#### Get All Transport Options
```http
GET /api/transport/options/
```

**Query Parameters:**
- `transport_type` (optional): Filter by transport type
- `from` (optional): Origin location
- `to` (optional): Destination location
- `page` (optional): Page number for pagination
- `limit` (optional): Results per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "transports": [
      {
        "id": "1",
        "type": "Bus",
        "name": "Green Line",
        "route": "Dhaka to Chittagong",
        "from_location": "Dhaka",
        "to_location": "Chittagong",
        "frequency": "Every 30 minutes",
        "price": 2.50,
        "currency": "USD",
        "image": "/figma_photos/greenline.jpeg",
        "features": ["Air Conditioned", "WiFi", "Wheelchair Accessible"],
        "rating": 4.5,
        "availability": true,
        "operator": "Green Line Paribahan",
        "schedule": {
          "departure_times": ["06:00", "08:00", "10:00", "12:00"],
          "duration": "6 hours 30 minutes",
          "stops": ["Comilla", "Feni"]
        }
      }
    ],
    "total_results": 25,
    "page": 1,
    "total_pages": 2
  },
  "message": "Transport options retrieved successfully"
}
```

#### Search Transport Options
```http
POST /api/transport/search/
```

**Request Body:**
```json
{
  "from": "Dhaka",
  "to": "Chittagong",
  "transport_type": "bus",
  "date": "2024-12-15",
  "passengers": 2,
  "max_price": 100,
  "features": ["Air Conditioned", "WiFi"],
  "sort_by": "price",
  "sort_order": "asc"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transports": [...],
    "total_results": 12,
    "page": 1,
    "total_pages": 1,
    "filters_applied": {
      "from": "Dhaka",
      "to": "Chittagong",
      "transport_type": "bus"
    }
  },
  "message": "Search completed successfully"
}
```

#### Get Transport Details
```http
GET /api/transport/options/{transport_id}/
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "type": "Bus",
    "name": "Green Line",
    "route": "Dhaka to Chittagong",
    "from_location": "Dhaka",
    "to_location": "Chittagong",
    "frequency": "Every 30 minutes",
    "price": 2.50,
    "currency": "USD",
    "image": "/figma_photos/greenline.jpeg",
    "features": ["Air Conditioned", "WiFi", "Wheelchair Accessible"],
    "rating": 4.5,
    "availability": true,
    "operator": "Green Line Paribahan",
    "contact_info": {
      "phone": "+880-123-456789",
      "email": "info@greenline.com",
      "website": "https://greenline.com"
    },
    "schedule": {
      "departure_times": ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
      "duration": "6 hours 30 minutes",
      "stops": ["Comilla", "Feni"]
    },
    "amenities": ["Free WiFi", "Air Conditioning", "Comfortable Seats", "Onboard Restroom"]
  },
  "message": "Transport details retrieved successfully"
}
```

### 2. Transport Booking

#### Create Transport Booking
```http
POST /api/transport/bookings/
```

**Request Body:**
```json
{
  "transport_id": "1",
  "passengers": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@email.com",
      "phone": "+880-987-654321",
      "dateOfBirth": "1990-01-15",
      "idNumber": "123456789",
      "seat_preference": "window"
    }
  ],
  "travel_date": "2024-12-15",
  "contact_email": "john.doe@email.com",
  "contact_phone": "+880-987-654321",
  "special_requests": "Vegetarian meal preferred",
  "total_price": 2.50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": "TRB-001",
    "booking_reference": "GL-20241215-001",
    "status": "confirmed",
    "transport_details": {
      "id": "1",
      "name": "Green Line",
      "route": "Dhaka to Chittagong",
      "departure_time": "08:00",
      "travel_date": "2024-12-15"
    },
    "passengers": [...],
    "total_amount": 2.50,
    "payment_status": "pending"
  },
  "message": "Booking created successfully"
}
```

#### Get User's Bookings
```http
GET /api/transport/bookings/my-bookings/
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
        "booking_id": "TRB-001",
        "booking_reference": "GL-20241215-001",
        "status": "confirmed",
        "transport_details": {...},
        "travel_date": "2024-12-15",
        "total_amount": 2.50,
        "created_at": "2024-12-01T10:00:00Z"
      }
    ],
    "total_bookings": 5
  },
  "message": "Bookings retrieved successfully"
}
```

#### Get Booking Details
```http
GET /api/transport/bookings/{booking_id}/
```

#### Update Booking
```http
PATCH /api/transport/bookings/{booking_id}/
```

#### Cancel Booking
```http
DELETE /api/transport/bookings/{booking_id}/
```

### 3. Package Integration Endpoints

#### Get Transport Options for Package
```http
GET /api/packages/transport-options/
```

**Query Parameters:**
- `from_location` (optional): Package origin
- `to_location` (optional): Package destination
- `budget_range` (optional): Price range filter
- `package_type` (optional): Type of package (luxury, budget, adventure)

**Response:**
```json
{
  "success": true,
  "data": {
    "transport_options": [
      {
        "id": "1",
        "name": "Green Line",
        "description": "Comfortable AC bus with Wi-Fi and entertainment system",
        "image": "/figma_photos/greenline.jpeg",
        "price": 2.50,
        "type": "Bus",
        "route": "Dhaka to Chittagong",
        "features": ["Air Conditioned", "WiFi", "Wheelchair Accessible"],
        "estimated_duration": "6 hours 30 minutes",
        "suitable_for_packages": true,
        "package_discount": 10
      }
    ]
  },
  "message": "Package transport options retrieved successfully"
}
```

#### Analyze Route for Package
```http
POST /api/packages/analyze-route/
```

**Request Body:**
```json
{
  "from_location": "Dhaka",
  "to_location": "Chittagong",
  "travelers_count": 4,
  "package_budget": 500,
  "preferences": {
    "comfort_level": "standard",
    "speed_priority": "medium",
    "cost_priority": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "from_location": "Dhaka",
    "to_location": "Chittagong",
    "distance": 244,
    "estimated_duration": "6-8 hours",
    "available_transports": [...],
    "recommended_transport": {
      "id": "1",
      "name": "Green Line",
      "reason": "Best balance of cost, comfort, and reliability"
    },
    "cost_comparison": {
      "cheapest": {
        "id": "3",
        "name": "Local Bus",
        "price": 1.50
      },
      "fastest": {
        "id": "7",
        "name": "Flight",
        "price": 85.00,
        "duration": "1 hour 15 minutes"
      },
      "most_comfortable": {
        "id": "1",
        "name": "Green Line Premium",
        "price": 4.50
      }
    }
  },
  "message": "Route analysis completed successfully"
}
```

### 4. Real-time Information

#### Get Live Transport Status
```http
GET /api/transport/live-status/{transport_id}/
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transport_id": "1",
    "name": "Green Line",
    "current_status": "on_time",
    "next_departure": "14:30",
    "delay_minutes": 0,
    "available_seats": 15,
    "last_updated": "2024-12-01T14:25:00Z"
  },
  "message": "Live status retrieved successfully"
}
```

#### Get Route Updates
```http
GET /api/transport/route-updates/
```

**Query Parameters:**
- `route` (optional): Specific route to check
- `transport_type` (optional): Filter by transport type

## TypeScript API Service Implementation

### Transport API Service Class

```typescript
export class TransportAPI {
  private static baseURL = API_BASE_URL;

  // Get all transport options
  static async getTransportOptions(params?: TransportSearchParams): Promise<TransportSearchResponse> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const endpoint = `/transport/options/${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest(endpoint);
  }

  // Search transport options
  static async searchTransports(searchParams: TransportSearchParams): Promise<TransportSearchResponse> {
    return await apiRequest('/transport/search/', {
      method: 'POST',
      body: JSON.stringify(searchParams),
    });
  }

  // Get transport details
  static async getTransportDetails(transportId: string): Promise<{ success: boolean; data: TransportOption; message: string }> {
    return await apiRequest(`/transport/options/${transportId}/`);
  }

  // Create booking
  static async createBooking(bookingData: TransportBookingData): Promise<TransportBookingResponse> {
    return await apiRequest('/transport/bookings/', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  // Get user bookings
  static async getUserBookings(filters?: { status?: string; date_from?: string; date_to?: string }): Promise<any> {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = `/transport/bookings/my-bookings/${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest(endpoint);
  }

  // Get booking details
  static async getBookingDetails(bookingId: string): Promise<any> {
    return await apiRequest(`/transport/bookings/${bookingId}/`);
  }

  // Update booking
  static async updateBooking(bookingId: string, updateData: Partial<TransportBookingData>): Promise<any> {
    return await apiRequest(`/transport/bookings/${bookingId}/`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  // Cancel booking
  static async cancelBooking(bookingId: string): Promise<any> {
    return await apiRequest(`/transport/bookings/${bookingId}/`, {
      method: 'DELETE',
    });
  }

  // Package integration methods
  static async getPackageTransportOptions(filters?: any): Promise<any> {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = `/packages/transport-options/${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest(endpoint);
  }

  static async analyzeRouteForPackage(routeData: any): Promise<RouteAnalysis> {
    return await apiRequest('/packages/analyze-route/', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  }

  // Live status methods
  static async getLiveStatus(transportId: string): Promise<any> {
    return await apiRequest(`/transport/live-status/${transportId}/`);
  }

  static async getRouteUpdates(filters?: { route?: string; transport_type?: string }): Promise<any> {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = `/transport/route-updates/${queryString ? `?${queryString}` : ''}`;
    
    return await apiRequest(endpoint);
  }
}
```

## Usage Examples

### For Public Transport Page

```typescript
// In PublicTransport component
import { TransportAPI } from '../api/transport';

const PublicTransport: React.FC = () => {
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  // Load transport options
  useEffect(() => {
    const loadTransports = async () => {
      setLoading(true);
      try {
        const response = await TransportAPI.getTransportOptions({
          transport_type: selectedType === 'all' ? undefined : selectedType,
          page: 1,
          limit: 20
        });
        
        if (response.success) {
          setTransportOptions(response.data.transports);
        }
      } catch (error) {
        console.error('Failed to load transports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransports();
  }, [selectedType]);

  // Search function
  const handleSearch = async (searchTerm: string) => {
    setLoading(true);
    try {
      const response = await TransportAPI.searchTransports({
        from: searchTerm.split(' to ')[0],
        to: searchTerm.split(' to ')[1],
        transport_type: selectedType === 'all' ? undefined : selectedType
      });
      
      if (response.success) {
        setTransportOptions(response.data.transports);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Book transport
  const handleBookTransport = async (transportId: string, passengerData: PassengerInfo[]) => {
    try {
      const bookingData: TransportBookingData = {
        transport_id: transportId,
        passengers: passengerData,
        travel_date: new Date().toISOString().split('T')[0],
        contact_email: passengerData[0].email,
        contact_phone: passengerData[0].phone || '',
        total_price: transportOptions.find(t => t.id === transportId)?.price || 0,
        booking_date: new Date().toISOString(),
        status: 'pending'
      };

      const response = await TransportAPI.createBooking(bookingData);
      
      if (response.success) {
        alert(`Booking confirmed! Reference: ${response.data.booking_reference}`);
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
import { TransportAPI } from '../api/transport';

const CreatePackages: React.FC = () => {
  const [packageTransports, setPackageTransports] = useState<TransportOption[]>([]);
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis | null>(null);

  // Load package-specific transport options
  const loadPackageTransports = async (fromLocation: string, toLocation: string) => {
    try {
      const response = await TransportAPI.getPackageTransportOptions({
        from_location: fromLocation,
        to_location: toLocation,
        package_type: 'standard'
      });

      if (response.success) {
        setPackageTransports(response.data.transport_options);
      }
    } catch (error) {
      console.error('Failed to load package transports:', error);
    }
  };

  // Analyze route for better recommendations
  const analyzeRoute = async (from: string, to: string, travelers: number, budget: number) => {
    try {
      const response = await TransportAPI.analyzeRouteForPackage({
        from_location: from,
        to_location: to,
        travelers_count: travelers,
        package_budget: budget,
        preferences: {
          comfort_level: 'standard',
          speed_priority: 'medium',
          cost_priority: 'high'
        }
      });

      if (response.success) {
        setRouteAnalysis(response.data);
        // Auto-select recommended transport
        setSelectedTransport(response.data.recommended_transport.id);
      }
    } catch (error) {
      console.error('Route analysis failed:', error);
    }
  };

  // Create package with selected transport
  const createPackageWithTransport = async (packageData: any) => {
    try {
      const packagePayload = {
        ...packageData,
        transport_id: selectedTransport,
        estimated_transport_cost: packageTransports.find(t => t.id === selectedTransport)?.price || 0
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

### For Package Booking

```typescript
// In confirm_book component
import { TransportAPI } from '../api/transport';

const ConfirmBook: React.FC = () => {
  const [packageDetails, setPackageDetails] = useState<any>(null);
  const [transportDetails, setTransportDetails] = useState<TransportOption | null>(null);

  // Load transport details for the package
  useEffect(() => {
    const loadTransportDetails = async () => {
      if (packageDetails?.transport_id) {
        try {
          const response = await TransportAPI.getTransportDetails(packageDetails.transport_id);
          
          if (response.success) {
            setTransportDetails(response.data);
          }
        } catch (error) {
          console.error('Failed to load transport details:', error);
        }
      }
    };

    loadTransportDetails();
  }, [packageDetails]);

  // Confirm booking with transport
  const confirmBooking = async (travelerDetails: any[]) => {
    try {
      // Create transport booking as part of package
      if (packageDetails.transport_id) {
        const transportBooking = await TransportAPI.createBooking({
          transport_id: packageDetails.transport_id,
          passengers: travelerDetails.map(traveler => ({
            firstName: traveler.firstName,
            lastName: traveler.lastName,
            email: traveler.email,
            phone: traveler.phone,
            dateOfBirth: traveler.dateOfBirth
          })),
          travel_date: packageDetails.start_date,
          contact_email: travelerDetails[0].email,
          contact_phone: travelerDetails[0].phone,
          total_price: transportDetails?.price || 0,
          booking_date: new Date().toISOString(),
          status: 'pending'
        });

        if (transportBooking.success) {
          // Update package with transport booking reference
          await packageAPI.updatePackage(packageDetails.id, {
            transport_booking_reference: transportBooking.data.booking_reference,
            status: 'confirmed'
          });
        }
      }

      alert('Package booking confirmed with transport!');
    } catch (error) {
      console.error('Booking confirmation failed:', error);
    }
  };

  return (
    // Component JSX...
  );
};
```

## Error Handling

```typescript
// Custom error types
export class TransportAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorType: 'NETWORK' | 'VALIDATION' | 'AUTHENTICATION' | 'SERVER'
  ) {
    super(message);
    this.name = 'TransportAPIError';
  }
}

// Enhanced error handling in API calls
const handleAPIError = (error: any): TransportAPIError => {
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 400:
        return new TransportAPIError('Invalid request parameters', 400, 'VALIDATION');
      case 401:
        return new TransportAPIError('Authentication required', 401, 'AUTHENTICATION');
      case 404:
        return new TransportAPIError('Transport not found', 404, 'VALIDATION');
      case 500:
        return new TransportAPIError('Server error occurred', 500, 'SERVER');
      default:
        return new TransportAPIError(`Request failed with status ${error.response.status}`, error.response.status, 'SERVER');
    }
  } else if (error.request) {
    // Network error
    return new TransportAPIError('Network connection failed', 0, 'NETWORK');
  } else {
    // Other error
    return new TransportAPIError(error.message || 'Unknown error occurred', 0, 'SERVER');
  }
};
```

## Caching & Performance

```typescript
// Simple cache implementation for transport data
class TransportCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

const transportCache = new TransportCache();

// Enhanced API methods with caching
export class CachedTransportAPI extends TransportAPI {
  static async getTransportOptions(params?: TransportSearchParams): Promise<TransportSearchResponse> {
    const cacheKey = `transport_options_${JSON.stringify(params)}`;
    const cached = transportCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const response = await super.getTransportOptions(params);
    transportCache.set(cacheKey, response);
    
    return response;
  }
}
```

## Testing Examples

```typescript
// Test utilities for transport API
export const mockTransportData: TransportOption[] = [
  {
    id: "1",
    type: "Bus",
    name: "Green Line",
    route: "Dhaka to Chittagong",
    from_location: "Dhaka",
    to_location: "Chittagong",
    frequency: "Every 30 minutes",
    price: 2.50,
    currency: "USD",
    image: "/figma_photos/greenline.jpeg",
    features: ["Air Conditioned", "WiFi", "Wheelchair Accessible"],
    rating: 4.5,
    availability: true,
    operator: "Green Line Paribahan"
  }
];

// Jest test example
describe('TransportAPI', () => {
  test('should fetch transport options successfully', async () => {
    const mockResponse = {
      success: true,
      data: { transports: mockTransportData, total_results: 1 },
      message: 'Success'
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    ) as jest.Mock;

    const result = await TransportAPI.getTransportOptions();
    
    expect(result.success).toBe(true);
    expect(result.data.transports).toHaveLength(1);
    expect(result.data.transports[0].name).toBe('Green Line');
  });
});
```

## Integration Checklist

### For Public Transport Page:
- [ ] Display transport options with filtering
- [ ] Search functionality across routes
- [ ] Real-time status updates
- [ ] Direct booking capability
- [ ] User booking history
- [ ] Transport details modal

### For Package Creation:
- [ ] Transport selection for packages
- [ ] Route analysis and recommendations
- [ ] Cost estimation integration
- [ ] Multiple transport options comparison
- [ ] Package transport preferences

### For Package Booking:
- [ ] Transport details in package confirmation
- [ ] Combined booking flow
- [ ] Transport booking as part of package
- [ ] Booking reference integration
- [ ] Payment flow coordination

This comprehensive API documentation provides everything needed to implement robust public transport functionality across your application, with seamless integration between standalone transport booking and package creation/booking workflows.