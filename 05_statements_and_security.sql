-- TASK 5: Generate Account Statement Reports and Security Setup
-- Database: PostgreSQL

-- ==========================================
-- 1. VIEW: Comprehensive Transaction History
-- ==========================================
-- This view abstracts the complexity of determining if an account was the sender or receiver.
-- It provides a unified ledger view for any given account.
CREATE OR REPLACE VIEW vw_account_transaction_history AS
SELECT 
    a.account_id,
    a.customer_id,
    t.transaction_id,
    t.transaction_date,
    t.transaction_type,
    -- Determine if it's a credit or debit based on the account's role in the transaction
    CASE 
        WHEN t.from_account_id = a.account_id THEN -t.amount
        ELSE t.amount
    END AS amount_change,
    t.description,
    -- Fetch the exact running balance recorded at the time of the transaction
    ast.new_balance AS running_balance
FROM 
    accounts a
JOIN 
    transactions t ON a.account_id = t.from_account_id OR a.account_id = t.to_account_id
JOIN
    account_statements ast ON ast.transaction_id = t.transaction_id AND ast.account_id = a.account_id;

-- ==========================================
-- 2. FUNCTION: Generate Statement (Filtered)
-- ==========================================
-- A parameterized function to retrieve a specific account's statement within a date range.
-- Using a function with parameters naturally prevents SQL injection at the database layer.
CREATE OR REPLACE FUNCTION get_account_statement(
    p_account_id INT,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT '1970-01-01 00:00:00+00',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
    transaction_date TIMESTAMP WITH TIME ZONE,
    transaction_type VARCHAR,
    amount_change DECIMAL,
    running_balance DECIMAL,
    description TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.transaction_date,
        v.transaction_type,
        v.amount_change,
        v.running_balance,
        v.description
    FROM 
        vw_account_transaction_history v
    WHERE 
        v.account_id = p_account_id
        AND v.transaction_date >= p_start_date
        AND v.transaction_date <= p_end_date
    ORDER BY 
        v.transaction_date DESC;
END;
$$;

-- Example Execution (Commented out):
-- SELECT * FROM get_account_statement(1, '2023-01-01', '2023-12-31');

-- ==========================================
-- 3. SECURITY: Least-Privilege Roles
-- ==========================================
-- It is critical for a banking app to never connect as a superuser.
-- Below is the conceptual setup for robust role-based access control (RBAC).

/* 
-- A. Application Role (For the Web/API Server)
CREATE ROLE banking_app_user WITH LOGIN PASSWORD 'secure_random_password';
GRANT CONNECT ON DATABASE banking_db TO banking_app_user;
GRANT USAGE ON SCHEMA public TO banking_app_user;

-- The app can read and write, but crucially, it CANNOT DELETE.
GRANT SELECT, INSERT, UPDATE ON customers, accounts, transactions, account_statements TO banking_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO banking_app_user;

-- B. Auditor Role (For Data Analytics and Reporting)
CREATE ROLE banking_auditor WITH LOGIN PASSWORD 'auditor_random_password';
GRANT CONNECT ON DATABASE banking_db TO banking_auditor;
GRANT USAGE ON SCHEMA public TO banking_auditor;

-- Auditors have strictly read-only access.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO banking_auditor;
*/
