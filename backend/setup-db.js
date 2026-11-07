/**
 * Database Setup Script
 * Run this once to create all tables and seed initial data.
 * Usage: node setup-db.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function setup() {
  console.log('🔌 Connecting to Aiven MySQL...');

  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  console.log('✅ Connected!\n');

  // ── Create tables ─────────────────────────────────────────────
  console.log('📦 Creating tables...');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(120)  NOT NULL,
      email       VARCHAR(255)  NOT NULL,
      message     TEXT          NOT NULL,
      received_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✅ contact_messages table ready');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      title        VARCHAR(200)  NOT NULL,
      description  TEXT          NOT NULL,
      technologies VARCHAR(500)  NOT NULL,
      github_url   VARCHAR(500)  DEFAULT '',
      live_url     VARCHAR(500)  DEFAULT '',
      featured     TINYINT(1)    NOT NULL DEFAULT 0,
      created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  ✅ projects table ready\n');

  // ── Check if projects already exist ───────────────────────────
  const [rows] = await connection.execute('SELECT COUNT(*) as count FROM projects');
  const count = rows[0].count;

  if (count > 0) {
    console.log(`ℹ️  Projects table already has ${count} rows — skipping seed.`);
  } else {
    console.log('🌱 Seeding initial projects...');

    const projects = [
      [
        'Portfolio Website',
        'A full-stack personal portfolio website built with React and Node.js/Express, featuring an admin dashboard, JWT authentication, and MySQL database.',
        'React,Node.js,Express,MySQL,CSS3',
        'https://github.com/emu1272',
        '',
        1
      ],
      [
        'Student Grade & Task Tracker',
        'A web application for students to manage coursework deadlines, track grades, calculate GPA, and organize daily study schedules.',
        'PHP,MySQL,HTML5,CSS3,JavaScript',
        'https://github.com/emu1272',
        '',
        1
      ],
      [
        'E-Commerce Website',
        'A dynamic e-commerce platform with product listing, shopping cart, user authentication, and order management system.',
        'React,PHP,MySQL,CSS3',
        'https://github.com/emu1272',
        '',
        0
      ],
      [
        'Network Security Monitor',
        'A basic network monitoring tool that scans for open ports, monitors traffic, and provides security reports for local networks.',
        'Java,Networking,Security',
        'https://github.com/emu1272',
        '',
        0
      ]
    ];

    for (const project of projects) {
      await connection.execute(
        'INSERT INTO projects (title, description, technologies, github_url, live_url, featured) VALUES (?, ?, ?, ?, ?, ?)',
        project
      );
      console.log(`  ✅ Added: ${project[0]}`);
    }
  }

  await connection.end();

  console.log('\n🎉 Database setup complete!');
  console.log('👉 Now restart your backend: node server.js');
}

setup().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
