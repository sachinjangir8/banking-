# ACID Compliance Documentation (MySQL + Node.js)

The "Online Banking Database System" strictly adheres to ACID principles to ensure all financial operations (specifically, fund transfers) are executed safely, even in highly concurrent environments or during system crashes. Below is a breakdown of how the Node.js API (using `mysql2`) and the MySQL InnoDB engine work together to guarantee this.

## 1. Atomicity (All or Nothing)
**Concept**: A transaction is treated as a single, indivisible logical unit of work.
**Enforcement**: 
- In `backend/server.js` (`POST /api/transfer`), the process starts with `connection.beginTransaction()`.
- The system attempts multiple interdependent operations: locking rows, verifying funds, updating the sender's balance, updating the receiver's balance, and logging the transaction.
- If **any** of these steps fail (e.g., throwing a Node.js `Error` for insufficient funds, or the database server crashing mid-query), the `catch` block intercepts it and executes `connection.rollback()`.
- The database perfectly discards any partial changes, ensuring an account is never debited if the credit step fails.

## 2. Consistency (Validity of Data)
**Concept**: A transaction must take the database from one valid state to another, strictly adhering to all defined rules.
**Enforcement**:
- **Database Layer**: The MySQL `schema.sql` leverages strict constraints:
  - `CHECK (balance >= 0)` on the `accounts` table physically prevents the database from storing negative balances.
  - `FOREIGN KEY` constraints with `ON DELETE RESTRICT` ensure referential integrity.
- **Application Layer**: Before attempting the `UPDATE` query, the API manually queries the sender's balance and throws an error if it falls below the transfer amount, providing a clean user-facing error message before the database constraint would inherently block it.

## 3. Isolation (Concurrency Control)
**Concept**: Concurrent transactions execute sequentially; intermediate states are invisible to other operations.
**Enforcement**:
- **Explicit Isolation Level**: The API explicitly sets `SET TRANSACTION ISOLATION LEVEL READ COMMITTED`. This ensures that we only read data that has been successfully committed, preventing dirty reads.
- **Pessimistic Locking**: To prevent "Lost Updates" (where two concurrent transfers overwrite each other's updates), we utilize `SELECT ... FOR UPDATE`. This creates an exclusive row-level lock on the specific accounts involved. Other transactions attempting to transfer money to/from these specific accounts must wait in line.
- **Deadlock Resolution**: We explicitly order our locks by locking the lowest `account_id` first. This generally prevents deadlocks. However, if a deadlock (`ER_LOCK_DEADLOCK`) still occurs due to MySQL's internal index locking mechanics, the API catches this specific error and automatically retries the transaction up to 3 times, making the failure invisible to the end user.

## 4. Durability (Persistence)
**Concept**: Once a transaction is committed, it is permanent and survives system failures (power loss, crashes).
**Enforcement**:
- The API finalizes the process by calling `connection.commit()`. 
- MySQL's **InnoDB engine** relies on the **Redo Log** (Write-Ahead Logging). When the commit is acknowledged by the Node server, it guarantees that the transaction changes are written to the persistent disk log. If the server crashes immediately after the response is sent, the database will automatically recover the committed transaction from the Redo Log on startup.
