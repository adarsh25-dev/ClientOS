-- Allow anon to select profiles for portal loading
CREATE POLICY "Client select profiles" ON profiles FOR SELECT TO anon USING (true);
