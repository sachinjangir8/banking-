-- TASK 1: Create Account and Transaction Schemas
-- Database: PostgreSQL

-- 1. Customers Table
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Accounts Table
-- A customer can have multiple accounts (e.g., Checking, Savings)
CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('Checking', 'Savings', 'Credit')),
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0), -- Prevent negative balance at schema level (unless credit, but keeping it simple)
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer
        FOREIGN KEY(customer_id) 
        REFERENCES customers(customer_id)
        ON DELETE RESTRICT -- Do not allow deleting a customer if they have accounts
);

-- 3. Transactions Table
-- Records all movements of money
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    from_account_id INT, -- Can be NULL for external deposits
    to_account_id INT,   -- Can be NULL for external withdrawals
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('Deposit', 'Withdrawal', 'Transfer')),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0), -- Must always be a positive amount
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed', 'Rolled_Back')),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    CONSTRAINT fk_from_account
        FOREIGN KEY(from_account_id)
        REFERENCES accounts(account_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_to_account
        FOREIGN KEY(to_account_id)
        REFERENCES accounts(account_id)
        ON DELETE RESTRICT,
    -- Ensure at least one account is involved
    CONSTRAINT chk_accounts_involved 
        CHECK (from_account_id IS NOT NULL OR to_account_id IS NOT NULL),
    -- Ensure an account cannot transfer to itself
    CONSTRAINT chk_different_accounts 
        CHECK (from_account_id IS DISTINCT FROM to_account_id)
);

-- 4. Audit / Statement Log (Optional but good for completeness and security)
-- Tracks changes to accounts for statement generation without solely relying on calculating from transactions
CREATE TABLE account_statements (
    statement_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    transaction_id INT, -- Which transaction caused this statement entry
    previous_balance DECIMAL(15, 2) NOT NULL,
    new_balance DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_statement_account
        FOREIGN KEY(account_id)
        REFERENCES accounts(account_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_statement_transaction
        FOREIGN KEY(transaction_id)
        REFERENCES transactions(transaction_id)
        ON DELETE RESTRICT
);
