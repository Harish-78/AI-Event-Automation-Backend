export interface College {
  id: string;
  name: string;
  city: string | null;
  taluka: string | null;
  district: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  short_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  registration_number: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  college_id: string;
  name: string;
  short_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  college_id: string;
  department_id: string | null;
  category: string;
  start_time: string;
  end_time: string;
  location: string | null;
  registration_deadline: string | null;
  max_participants: number | null;
  created_by: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}
<<<<<<< HEAD

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'registered' | 'cancelled' | 'attended';
  registered_at: string;
  cancelled_at: string | null;
}
=======
>>>>>>> origin/main
