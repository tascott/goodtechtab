-- Schema for Good Tech News Database

CREATE TYPE sentiment_level AS ENUM ('very_high', 'high', 'neutral');

CREATE TABLE curated_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    source_url TEXT NOT NULL,
    source_name VARCHAR(100),
    sentiment sentiment_level DEFAULT 'neutral',
    content_type VARCHAR(50) NOT NULL, -- 'rss', 'reddit', 'ai_generated'
    published_at TIMESTAMP WITH TIME ZONE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB -- For storing any additional data specific to content type
);

-- Index for faster queries
CREATE INDEX idx_curated_content_sentiment ON curated_content(sentiment);
CREATE INDEX idx_curated_content_type ON curated_content(content_type);
CREATE INDEX idx_curated_content_active ON curated_content(is_active);

-- Function to update last_updated_at timestamp
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update last_updated_at
CREATE TRIGGER update_curated_content_last_updated
    BEFORE UPDATE ON curated_content
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();

-- Comments
COMMENT ON TABLE curated_content IS 'Stores all curated positive tech content';
COMMENT ON COLUMN curated_content.content_type IS 'Indicates the source type of the content (RSS, Reddit, AI-generated)';
COMMENT ON COLUMN curated_content.metadata IS 'Stores source-specific data like Reddit score, RSS feed metadata, etc.';