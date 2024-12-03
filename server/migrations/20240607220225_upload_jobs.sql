-- Add migration script here
CREATE TABLE IF NOT EXISTS `upload_jobs` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`user_id` INT(11) NOT NULL DEFAULT '0',
	`created_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
	`updated_at` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
	`state` TINYINT(4) NOT NULL DEFAULT '0',
	PRIMARY KEY (`id`) USING BTREE,
	CONSTRAINT `upload_jobs_user_id` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `upload_job_items` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`upload_job_id` INT(11) NOT NULL,
	`name` VARCHAR(255) NOT NULL COLLATE 'latin1_swedish_ci',
	`data` TEXT NOT NULL DEFAULT '{}' COLLATE 'latin1_swedish_ci',
	`state` TINYINT(4) NOT NULL DEFAULT '0',
	`progress` FLOAT NOT NULL DEFAULT '0',
	`job_type` TINYINT(4) NOT NULL,
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `upload_job_items_job_id` (`upload_job_id`) USING BTREE,
	CONSTRAINT `upload_job_items_job_id` FOREIGN KEY (`upload_job_id`) REFERENCES `upload_jobs` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);