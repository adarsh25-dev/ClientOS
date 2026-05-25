-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  agency_name TEXT,
  tagline TEXT,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#C9A84C',
  portal_slug TEXT UNIQUE,
  portal_settings JSONB DEFAULT '{}'::jsonb,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  logo_url TEXT,
  portal_access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create milestones table
CREATE TABLE milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE,
  order_index INTEGER DEFAULT 0
);

-- Create updates table (AI-generated updates)
CREATE TABLE updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  raw_notes TEXT,
  tone TEXT DEFAULT 'professional',
  read_by_client BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create files table
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid')),
  notes TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  author_type TEXT CHECK (author_type IN ('freelancer', 'client')),
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- Freelancer Policies (Authenticated users query their own rows)
-- -------------------------------------------------------------

-- profiles: Users can only read/write their own row
CREATE POLICY "Freelancer profiles access" ON profiles FOR ALL TO authenticated USING (auth.uid() = id);

-- clients: Freelancers can CRUD their own clients
CREATE POLICY "Freelancer clients access" ON clients FOR ALL TO authenticated USING (auth.uid() = freelancer_id);

-- projects: Freelancers can CRUD their own projects
CREATE POLICY "Freelancer projects access" ON projects FOR ALL TO authenticated USING (auth.uid() = freelancer_id);

-- milestones: Freelancers can CRUD milestones on their own projects
CREATE POLICY "Freelancer milestones access" ON milestones FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = milestones.project_id AND projects.freelancer_id = auth.uid()));

-- updates: Freelancers can CRUD updates on their own projects
CREATE POLICY "Freelancer updates access" ON updates FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = updates.project_id AND projects.freelancer_id = auth.uid()));

-- files: Freelancers can CRUD files on their own projects
CREATE POLICY "Freelancer files access" ON files FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = files.project_id AND projects.freelancer_id = auth.uid()));

-- invoices: Freelancers can CRUD their own invoices
CREATE POLICY "Freelancer invoices access" ON invoices FOR ALL TO authenticated USING (auth.uid() = freelancer_id);

-- feedback: Freelancers can CRUD feedback on their own projects
CREATE POLICY "Freelancer feedback access" ON feedback FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = feedback.project_id AND projects.freelancer_id = auth.uid()));

-- -------------------------------------------------------------
-- Client Policies (Anonymous portal token-based access)
-- -------------------------------------------------------------

-- clients: Clients can select client information
CREATE POLICY "Client select clients" ON clients FOR SELECT TO anon USING (true);

-- projects: Clients can select project information
CREATE POLICY "Client select projects" ON projects FOR SELECT TO anon USING (true);

-- milestones: Clients can select milestone details
CREATE POLICY "Client select milestones" ON milestones FOR SELECT TO anon USING (true);

-- updates: Clients can select updates and mark them as read
CREATE POLICY "Client select updates" ON updates FOR SELECT TO anon USING (true);
CREATE POLICY "Client update updates" ON updates FOR UPDATE TO anon USING (true);

-- files: Clients can select files and update their status (Approve / Request Changes)
CREATE POLICY "Client select files" ON files FOR SELECT TO anon USING (true);
CREATE POLICY "Client update files" ON files FOR UPDATE TO anon USING (true);

-- invoices: Clients can select invoices and update their status (Viewed / Paid)
CREATE POLICY "Client select invoices" ON invoices FOR SELECT TO anon USING (true);
CREATE POLICY "Client update invoices" ON invoices FOR UPDATE TO anon USING (true);

-- feedback: Clients can select feedback and insert new comments
CREATE POLICY "Client select feedback" ON feedback FOR SELECT TO anon USING (true);
CREATE POLICY "Client insert feedback" ON feedback FOR INSERT TO anon WITH CHECK (author_type = 'client');

-- -------------------------------------------------------------
-- Storage Setup
-- -------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('clientos-files', 'clientos-files', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'clientos-files');
CREATE POLICY "Allow public reading" ON storage.objects FOR SELECT TO public USING (bucket_id = 'clientos-files');
CREATE POLICY "Allow authenticated updates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'clientos-files');
CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'clientos-files');
