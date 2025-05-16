-- Update existing users with role 'USER' to have role 'CUSTOMER'
UPDATE User SET role = 'CUSTOMER' WHERE role = 'USER'; 