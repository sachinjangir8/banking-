-- TASK 2: Store Customer and Balance Data
-- Description: Seeding initial customers and their account balances.

-- 1. Insert Customers
-- We are using realistic sample data for an online banking scenario.
INSERT INTO customers (first_name, last_name, email, phone) VALUES
('Alice', 'Johnson', 'alice.johnson@example.com', '555-0101'),
('Bob', 'Smith', 'bob.smith@example.com', '555-0102'),
('Charlie', 'Brown', 'charlie.brown@example.com', '555-0103');

-- 2. Insert Accounts
-- Ensuring we use precise DECIMAL values (e.g., 1500.50) to prevent floating point inaccuracies.
-- We use subqueries to get the correct customer_id dynamically based on their email.

INSERT INTO accounts (customer_id, account_type, balance, currency, status) VALUES
(
    (SELECT customer_id FROM customers WHERE email = 'alice.johnson@example.com'), 
    'Checking', 
    1500.50, 
    'USD', 
    'Active'
),
(
    (SELECT customer_id FROM customers WHERE email = 'alice.johnson@example.com'), 
    'Savings', 
    5000.00, 
    'USD', 
    'Active'
),
(
    (SELECT customer_id FROM customers WHERE email = 'bob.smith@example.com'), 
    'Checking', 
    300.00, 
    'USD', 
    'Active'
),
(
    (SELECT customer_id FROM customers WHERE email = 'charlie.brown@example.com'), 
    'Checking', 
    10000.00, 
    'USD', 
    'Active'
),
(
    (SELECT customer_id FROM customers WHERE email = 'charlie.brown@example.com'), 
    'Savings', 
    25000.00, 
    'USD', 
    'Active'
);

-- 3. (Optional) Initialize account_statements for the initial deposits
-- To keep the audit trail complete, we treat the starting balances as initial deposits.
-- In a real scenario, this would be tied to an actual external deposit transaction.

-- We can leave account statements blank until real transactions begin, 
-- or we can simulate initial funding. Let's keep it simple and assume 
-- these are the starting states of the database.
