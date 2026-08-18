-- DropForeignKey
ALTER TABLE `districts` DROP FOREIGN KEY `districts_provinceId_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_userId_fkey`;

-- DropForeignKey
ALTER TABLE `wards` DROP FOREIGN KEY `wards_districtId_fkey`;

-- DropIndex
DROP INDEX `wards_districtId_fkey` ON `wards`;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `depositAmount` DECIMAL(12, 2) NULL,
    ADD COLUMN `earnedVipPoints` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isDepositPayment` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `pickupTime` DATETIME(3) NULL,
    ADD COLUMN `pointsCreditedAt` DATETIME(3) NULL,
    ADD COLUMN `usedVipPoints` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `vipDiscountAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    MODIFY `userId` VARCHAR(191) NULL,
    MODIFY `paymentStatus` ENUM('PENDING', 'PARTIALLY_PAID', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `provinces` ADD COLUMN `mergedFrom` VARCHAR(191) NULL,
    ADD COLUMN `region` ENUM('NORTH', 'CENTRAL', 'SOUTH') NOT NULL DEFAULT 'NORTH';

-- AlterTable
ALTER TABLE `users` ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
    ADD COLUMN `vipPoints` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `vipPointsDebt` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `wards` DROP COLUMN `districtId`,
    ADD COLUMN `mergedFrom` VARCHAR(191) NULL,
    ADD COLUMN `provinceId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `districts`;

-- CreateIndex
CREATE UNIQUE INDEX `users_phone_key` ON `users`(`phone`);

-- CreateIndex
CREATE INDEX `wards_provinceId_fkey` ON `wards`(`provinceId`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wards` ADD CONSTRAINT `wards_provinceId_fkey` FOREIGN KEY (`provinceId`) REFERENCES `provinces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

