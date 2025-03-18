-- Drop existing table if it exists
IF OBJECT_ID('dbo.resources', 'U') IS NOT NULL
BEGIN
    -- Drop foreign key constraint first
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'FK_resources_projects') AND parent_object_id = OBJECT_ID(N'dbo.resources'))
    BEGIN
        ALTER TABLE dbo.resources DROP CONSTRAINT FK_resources_projects;
    END
    
    -- Drop primary key constraint
    IF EXISTS (SELECT * FROM sys.key_constraints WHERE object_id = OBJECT_ID(N'PK_resources') AND parent_object_id = OBJECT_ID(N'dbo.resources'))
    BEGIN
        ALTER TABLE dbo.resources DROP CONSTRAINT PK_resources;
    END
    
    -- Drop the table
    DROP TABLE dbo.resources;
END
GO

-- Create resources table with updated column lengths
CREATE TABLE resources (
    id INT IDENTITY(1,1) PRIMARY KEY,
    project_id INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    type NVARCHAR(50) NOT NULL,
    url NVARCHAR(MAX),
    file_path NVARCHAR(255),
    file_type NVARCHAR(100),
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
GO

-- Add file_path and file_type columns to resources table
ALTER TABLE [dbo].[resources]
ADD [file_path] [nvarchar](255) NULL,
    [file_type] [nvarchar](50) NULL;

-- Make url column nullable since it's not required for file uploads
ALTER TABLE [dbo].[resources]
ALTER COLUMN [url] [nvarchar](max) NULL;

-- Update existing resources to have empty file fields
UPDATE resources
SET file_path = '',
    file_type = ''
WHERE file_path IS NULL;

-- Check if file_type column exists and modify its length
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.resources') AND name = 'file_type')
BEGIN
    ALTER TABLE resources ALTER COLUMN file_type NVARCHAR(100);
END
GO 