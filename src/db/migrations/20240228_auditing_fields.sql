-- Add auditing fields to colleges, users, departments, and events
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

ALTER TABLE departments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);
