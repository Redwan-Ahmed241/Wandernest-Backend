-- Visa Assistance API Database Schema
-- Generated for Wandernest Backend

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    visa_policy_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visa categories table
CREATE TABLE IF NOT EXISTS visa_categories (
    id VARCHAR(50) PRIMARY KEY,
    country_code VARCHAR(2) NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    validity_days INTEGER NOT NULL,
    max_stay_days INTEGER NOT NULL,
    multiple_entry BOOLEAN DEFAULT false,
    fees JSONB DEFAULT '[]'::jsonb,
    processing_times JSONB DEFAULT '[]'::jsonb,
    requirements JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(country_code, slug)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) NOT NULL REFERENCES countries(code),
    category_slug VARCHAR(100) NOT NULL,
    applicant JSONB NOT NULL,
    travel JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'additional_info_required', 'approved', 'rejected', 'withdrawn')),
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'succeeded', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (country_code, category_slug) REFERENCES visa_categories(country_code, slug)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    requirement_key VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'received' CHECK (status IN ('received', 'approved', 'rejected')),
    reviewer_note TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    center_code VARCHAR(50) NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'rescheduled', 'canceled', 'attended')),
    location JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'bkash', 'sslcommerz', 'mock')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    receipt_url TEXT,
    idempotency_key VARCHAR(100) UNIQUE
);

-- Status events table
CREATE TABLE IF NOT EXISTS status_events (
    id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visa_categories_country ON visa_categories(country_code);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_country ON applications(country_code);

-- =====================================================
-- BOOKING SYSTEM TABLES
-- =====================================================

-- User Booked Packages Table
CREATE TABLE IF NOT EXISTS user_booked_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_id bigint NOT NULL,
  
  -- Snapshot of package details at booking time
  title varchar NOT NULL,
  description text,
  from_location varchar,
  to_location varchar,
  duration varchar,
  price numeric NOT NULL,
  image_url varchar,
  transport_id bigint,
  transport_name varchar,
  hotel_id bigint,
  hotel_name varchar,
  guide_id bigint,
  guide_name varchar,
  package_type varchar,
  subtitle text,
  
  -- Booking details
  start_date date NOT NULL,
  end_date date NOT NULL,
  travelers integer DEFAULT 1 CHECK (travelers >= 1),
  status varchar DEFAULT 'confirmed',
  
  booking_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_booked_packages_user_id ON user_booked_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_booked_packages_status ON user_booked_packages(status);

-- User Booked Hotels Table
CREATE TABLE IF NOT EXISTS user_booked_hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hotel_id varchar NOT NULL,
  
  -- Snapshot of hotel details at booking time
  name varchar NOT NULL,
  location varchar NOT NULL,
  description text,
  room_type varchar,
  price_per_night numeric NOT NULL,
  image_url varchar,
  amenities text,
  star integer,
  hotel_type varchar,
  
  -- Booking details
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  rooms integer DEFAULT 1 CHECK (rooms >= 1),
  guests integer DEFAULT 1 CHECK (guests >= 1),
  total_price numeric NOT NULL,
  status varchar DEFAULT 'confirmed',
  
  booking_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_booked_hotels_user_id ON user_booked_hotels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_booked_hotels_status ON user_booked_hotels(status);

-- User Booked Flights Table
CREATE TABLE IF NOT EXISTS user_booked_flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  flight_id varchar NOT NULL,
  
  -- Snapshot of flight details at booking time
  flight_number varchar NOT NULL,
  airline varchar NOT NULL,
  departure_airport varchar NOT NULL,
  arrival_airport varchar NOT NULL,
  departure_city varchar,
  arrival_city varchar,
  price numeric NOT NULL,
  booking_class varchar,
  duration varchar,
  baggage_allowance varchar,
  meal_included boolean,
  wifi_available boolean,
  
  -- Booking details
  departure_time timestamptz NOT NULL,
  arrival_time timestamptz NOT NULL,
  passengers integer DEFAULT 1 CHECK (passengers >= 1),
  total_price numeric NOT NULL,
  status varchar DEFAULT 'confirmed',
  
  booking_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_booked_flights_user_id ON user_booked_flights(user_id);
CREATE INDEX IF NOT EXISTS idx_user_booked_flights_status ON user_booked_flights(status);
CREATE INDEX IF NOT EXISTS idx_documents_application ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_appointments_application ON appointments(application_id);
CREATE INDEX IF NOT EXISTS idx_payments_application ON payments(application_id);
CREATE INDEX IF NOT EXISTS idx_status_events_application ON status_events(application_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visa_categories_updated_at BEFORE UPDATE ON visa_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();