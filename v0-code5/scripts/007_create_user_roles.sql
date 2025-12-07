-- Create user roles table
CREATE TYPE user_role AS ENUM ('user', 'trader', 'admin');

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add indices
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Create function to automatically create user role on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Create view for user permissions
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
    u.id,
    u.email,
    ur.role,
    u.raw_user_meta_data->>'wallet_address' as wallet_address,
    u.raw_user_meta_data->>'wallet_chain_id' as wallet_chain_id
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id;