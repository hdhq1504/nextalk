-- CreateIndex
CREATE INDEX "conversation_members_user_id_is_hidden_idx" ON "conversation_members"("user_id", "is_hidden");

-- CreateIndex
CREATE INDEX "conversation_members_conversation_id_joined_at_idx" ON "conversation_members"("conversation_id", "joined_at");

-- CreateIndex
CREATE INDEX "friend_requests_receiver_id_status_idx" ON "friend_requests"("receiver_id", "status");

-- CreateIndex
CREATE INDEX "friend_requests_sender_id_status_idx" ON "friend_requests"("sender_id", "status");

-- CreateIndex
CREATE INDEX "friendships_user_id_created_at_idx" ON "friendships"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");
