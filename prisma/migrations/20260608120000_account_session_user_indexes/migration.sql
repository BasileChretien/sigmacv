-- Index the Auth.js foreign keys queried/cascade-deleted by userId.
-- Without these, Account lookups on sign-in and Session/Account cascade deletes
-- are sequential scans that worsen as the user table grows.

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
