-- CreateTable
CREATE TABLE `Enquiry` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(16) NOT NULL,
    `phoneLastFour` VARCHAR(4) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(15) NOT NULL,
    `customerWhatsapp` VARCHAR(15) NOT NULL,
    `deliveryAddress` JSON NOT NULL,
    `items` JSON NOT NULL,
    `totalPaise` INTEGER NOT NULL,
    `status` ENUM('ENQUIRY', 'CONFIRMED', 'MAKING', 'DISPATCHED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'ENQUIRY',
    `paymentStatus` ENUM('PENDING', 'PAID', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `razorpayOrderId` VARCHAR(64) NULL,
    `razorpayPaymentId` VARCHAR(64) NULL,
    `trackingNumber` VARCHAR(64) NULL,
    `adminNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Enquiry_token_key`(`token`),
    INDEX `Enquiry_token_idx`(`token`),
    INDEX `Enquiry_status_idx`(`status`),
    INDEX `Enquiry_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnquiryMessage` (
    `id` VARCHAR(191) NOT NULL,
    `enquiryId` VARCHAR(191) NOT NULL,
    `senderType` VARCHAR(10) NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EnquiryMessage_enquiryId_idx`(`enquiryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnquiryRating` (
    `id` VARCHAR(191) NOT NULL,
    `enquiryId` VARCHAR(191) NOT NULL,
    `stars` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EnquiryRating_enquiryId_key`(`enquiryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EnquiryMessage` ADD CONSTRAINT `EnquiryMessage_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `Enquiry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnquiryRating` ADD CONSTRAINT `EnquiryRating_enquiryId_fkey` FOREIGN KEY (`enquiryId`) REFERENCES `Enquiry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
