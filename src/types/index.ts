export type Role = 'admin' | 'company' | 'jobseeker'
export type ApplicationStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected'
export type EmploymentType = 'fulltime' | 'parttime' | 'contract' | 'internship'

export interface Profile {
  id: string
  role: Role
  name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  profile_id: string
  name: string
  industry: string | null
  description: string | null
  logo_url: string | null
  location: string | null
  employee_count: string | null
  founded_year: number | null
  website_url: string | null
  slug: string | null
  is_approved: boolean
  created_at: string
  updated_at: string
}

export interface JobListing {
  id: string
  company_id: string
  title: string
  catchcopy: string | null
  employment_type: EmploymentType
  salary_min: number | null
  salary_max: number | null
  salary_description: string | null
  location: string | null
  description: string | null
  requirements: string | null
  benefits: string | null
  appeal_tags: string[]
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface InternshipProgram {
  id: string
  company_id: string
  title: string
  duration: string | null
  description: string | null
  requirements: string | null
  capacity: number | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  jobseeker_id: string
  job_listing_id: string | null
  internship_id: string | null
  status: ApplicationStatus
  message: string | null
  created_at: string
  updated_at: string
}

export interface Bookmark {
  id: string
  jobseeker_id: string
  company_id: string
  created_at: string
}
