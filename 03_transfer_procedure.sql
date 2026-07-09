-- TASK 3: Implement Transaction-Based Transfers
-- Description: Stored procedure to transfer funds securely between two accounts.
-- Database: PostgreSQL

CREATE OR REPLACE PROCEDURE transfer_funds(
    p_from_account_id INT,
    p_to_account_id INT,
    p_transfer_amount DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_from_prev_balance DECIMAL;
    v_to_prev_balance DECIMAL;
    v_from_new_balance DECIMAL;
    v_to_new_balance DECIMAL;
    v_transaction_id INT;
BEGIN
    -- 1. Initial Data Validation
    IF p_transfer_amount <= 0 THEN
        RAISE EXCEPTION 'Transfer amount must be strictly greater than zero.';
    END IF;

    IF p_from_account_id = p_to_account_id THEN
        RAISE EXCEPTION 'Cannot transfer funds to the exact same account.';
    END IF;

    -- 2. Concurrency Control (Isolation)
    -- We lock the rows to prevent race conditions if multiple transfers occur simultaneously.
    -- To avoid deadlocks, we always acquire row locks in a consistent order (lowest ID first).
    IF p_from_account_id < p_to_account_id THEN
        PERFORM * FROM accounts WHERE account_id = p_from_account_id FOR UPDATE;
        PERFORM * FROM accounts WHERE account_id = p_to_account_id FOR UPDATE;
    ELSE
        PERFORM * FROM accounts WHERE account_id = p_to_account_id FOR UPDATE;
        PERFORM * FROM accounts WHERE account_id = p_from_account_id FOR UPDATE;
    END IF;

    -- 3. Verify Sender Account and Funds
    SELECT balance INTO v_from_prev_balance 
    FROM accounts WHERE account_id = p_from_account_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source account % does not exist.', p_from_account_id;
    END IF;

    IF v_from_prev_balance < p_transfer_amount THEN
        RAISE EXCEPTION 'Insufficient funds in the source account (ID: %).', p_from_account_id;
    END IF;

    -- 4. Verify Receiver Account
    SELECT balance INTO v_to_prev_balance 
    FROM accounts WHERE account_id = p_to_account_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Destination account % does not exist.', p_to_account_id;
    END IF;

    -- 5. Execute the Transfer (Atomic updates)
    -- Debit Sender
    UPDATE accounts 
    SET balance = balance - p_transfer_amount, updated_at = CURRENT_TIMESTAMP 
    WHERE account_id = p_from_account_id
    RETURNING balance INTO v_from_new_balance;

    -- Credit Receiver
    UPDATE accounts 
    SET balance = balance + p_transfer_amount, updated_at = CURRENT_TIMESTAMP 
    WHERE account_id = p_to_account_id
    RETURNING balance INTO v_to_new_balance;

    -- 6. Log the Transaction
    INSERT INTO transactions (from_account_id, to_account_id, transaction_type, amount, status, description)
    VALUES (p_from_account_id, p_to_account_id, 'Transfer', p_transfer_amount, 'Completed', 'Fund transfer via stored procedure')
    RETURNING transaction_id INTO v_transaction_id;

    -- 7. Log Account Statements (Audit Trail)
    INSERT INTO account_statements (account_id, transaction_id, previous_balance, new_balance)
    VALUES (p_from_account_id, v_transaction_id, v_from_prev_balance, v_from_new_balance);

    INSERT INTO account_statements (account_id, transaction_id, previous_balance, new_balance)
    VALUES (p_to_account_id, v_transaction_id, v_to_prev_balance, v_to_new_balance);

    -- 8. Commit the transaction explicitly
    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        -- If any error occurs (insufficient funds, constraint violation, system error),
        -- the entire block is rolled back here to guarantee Atomicity.
        ROLLBACK;
        
        -- Optionally, log the failed transaction attempt if you have a separate un-transactional log table
        -- Re-raise the exception so the calling application knows the transfer failed
        RAISE;
END;
$$;

-- Example Execution (Do not uncomment in the schema, just for reference):
-- CALL transfer_funds(1, 2, 150.00);
