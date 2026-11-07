-- =============================================
-- EmebetPortfolio Database Schema
-- Run this SQL file once on your Aiven MySQL
-- to create the required tables.
-- =============================================

-- Contact messages from the portfolio contact form
CREATE TABLE IF NOT EXISTS contact_messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120)  NOT NULL,
  email       VARCHAR(255)  NOT NULL,
  message     TEXT          NOT NULL,
  received_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio projects (for future dynamic management via AdminDashboard)
CREATE TABLE IF NOT EXISTS projects (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200)  NOT NULL,
  description  TEXT          NOT NULL,
  technologies VARCHAR(500)  NOT NULL COMMENT 'Comma-separated list',
  github_url   VARCHAR(500)  DEFAULT '',
  live_url     VARCHAR(500)  DEFAULT '',
  featured     TINYINT(1)    NOT NULL DEFAULT 0,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed with sample projects
INSERT INTO projects (title, description, technologies, github_url, live_url, featured) VALUES
(
  'Personal Portfolio Website',
  'A full-stack responsive web application built with React, Node.js Express, and Aiven MySQL for managing contact inquiries.',
  'React,Vite,Node.js,Express,MySQL,CSS3',
  'https://github.com/emebet-morde/portfolio',
  'https://emebetmorde.dev',
  1
),
(
  'Algorithm Visualizer',
  'An interactive educational tool that visualizes classic sorting (Merge, Quick, Bubble) and graph traversal (BFS, DFS) algorithms.',
  'JavaScript,HTML5 Canvas,CSS3,Algorithms',
  'https://github.com/emebet-morde/algorithm-visualizer',
  '',
  1
),
(
  'Student Task & Grade Tracker',
  'A web platform for students to track coursework deadlines, calculate GPA projections, and organize daily study schedules.',
  'Node.js,Express,REST API,Database,Bootstrap',
  'https://github.com/emebet-morde/student-tracker',
  '',
  0
);
