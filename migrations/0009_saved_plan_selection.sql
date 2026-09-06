-- Preserve the model and context chosen when a finder plan is saved.
-- Existing machines keep their previous 8K estimate and no explicit model choice.
ALTER TABLE machines ADD COLUMN context TEXT NOT NULL DEFAULT '8k'
  CHECK (context IN ('4k', '8k', '16k', '32k'));

ALTER TABLE machines ADD COLUMN selected_model_id TEXT
  CHECK (selected_model_id IS NULL OR (
    length(selected_model_id) BETWEEN 1 AND 128
    AND substr(selected_model_id, 1, 1) GLOB '[a-zA-Z0-9]'
    AND selected_model_id NOT GLOB '*[^a-zA-Z0-9._-]*'
  ));
