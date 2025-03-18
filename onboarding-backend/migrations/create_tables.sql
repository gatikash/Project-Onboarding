-- Create projects table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[projects]') AND type in (N'U'))
BEGIN
  CREATE TABLE projects (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE()
  )
END
ELSE
BEGIN
  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[projects]') AND name = 'created_at')
  BEGIN
    ALTER TABLE projects ADD created_at DATETIME NOT NULL DEFAULT GETDATE()
  END
END
GO

-- Create tasks table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND type in (N'U'))
BEGIN
  CREATE TABLE tasks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    task NVARCHAR(255) NOT NULL,
    project_id INT NOT NULL,
    assigned_to INT,
    description NVARCHAR(MAX),
    status NVARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  )
END
ELSE
BEGIN
  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND name = 'created_at')
  BEGIN
    ALTER TABLE tasks ADD created_at DATETIME NOT NULL DEFAULT GETDATE()
  END

  -- Add project_id column if it doesn't exist
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND name = 'project_id')
  BEGIN
    ALTER TABLE tasks ADD project_id INT NOT NULL
    ALTER TABLE tasks ADD CONSTRAINT FK_tasks_projects FOREIGN KEY (project_id) REFERENCES projects(id)
  END
END
GO 