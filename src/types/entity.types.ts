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

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string | null;
  mjml_content: string;
  college_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  template_id: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_at: string | null;
  college_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}
