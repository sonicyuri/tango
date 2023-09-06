/*
  Warnings:

  - You are about to drop the `user_auth_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `user_auth_tokens` DROP FOREIGN KEY `user_auth_tokens_user_id_fkey`;

-- DropTable
DROP TABLE `user_auth_tokens`;
