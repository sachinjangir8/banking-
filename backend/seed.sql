-- Clear existing data (Postgres handles FK cascades well with TRUNCATE)
TRUNCATE TABLE transactions, accounts, customers RESTART IDENTITY CASCADE;

-- 1. Insert Mock Customers
-- Password for mock users: '1234567' for first, 'password123' for rest
INSERT INTO customers (first_name, last_name, email, phone, password_hash) VALUES
('sachin', 'jinn', 'sachinjangir1319@gmail.com', '555-0101', '$2b$10$orvsJN3T6auHbTYlGQeZteyfLWoj4r6sAyzkwqARlUv0C2mKslVOy'),
('jangir', 'Smith', 'jangir@gmail.com', '555-0102', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa'),
('kamal', 'barbar', 'kamal@gmail.com', '555-0103', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa');

-- 2. Insert Mock Accounts
-- Customer 1 gets a checking and savings
INSERT INTO accounts (customer_id, account_type, balance, currency, status) VALUES
(1, 'Checking', 1500.50, 'INR', 'Active'),
(1, 'Savings', 5000.00, 'INR', 'Active');

-- Customer 2 gets a checking
INSERT INTO accounts (customer_id, account_type, balance, currency, status) VALUES
(2, 'Checking', 300.00, 'INR', 'Active');

-- Customer 3 gets a checking and savings
INSERT INTO accounts (customer_id, account_type, balance, currency, status) VALUES
(3, 'Checking', 10000.00, 'INR', 'Active'),
(3, 'Savings', 25000.00, 'INR', 'Active');
