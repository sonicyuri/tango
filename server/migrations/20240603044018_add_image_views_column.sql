-- Add view column
ALTER TABLE images ADD views INTEGER NOT NULL DEFAULT 0;

-- Update with existing views
UPDATE images AS i 
INNER JOIN (
	SELECT COUNT(id) AS view_count, image_id
	FROM image_views
	GROUP BY image_id
) iv ON iv.image_id = i.id 
SET i.views = iv.view_count;