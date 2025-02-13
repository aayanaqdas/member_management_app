-- setup_db.sql

-- Create the database if it does not already exist
CREATE DATABASE IF NOT EXISTS memberlist;

-- Select the newly created database for use
USE memberlist;

-- Create a new user for the database with the specified username and password
CREATE USER IF NOT EXISTS 'flaskuser'@'%' IDENTIFIED BY 'password'; --% means any host can connect to the database

-- Grant all privileges on the database to the newly created user
GRANT ALL PRIVILEGES ON memberlist.* TO 'flaskuser'@'%';
-- Apply the changes made to the privileges
FLUSH PRIVILEGES;

-- Create the users table if it does not already exist
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,  
    name VARCHAR(80) NOT NULL,  
    email VARCHAR(120) DEFAULT NULL,
    number VARCHAR(20) NOT NULL,
    address VARCHAR(120),
    department VARCHAR(120) NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    comment TEXT DEFAULT NULL,
    UNIQUE (email, department),
    UNIQUE (email, number, department),
    UNIQUE (number, department)
);

-- Add the necessary constraints (if they dont exists already)
ALTER TABLE members ADD CONSTRAINT unique_name_email_number_department UNIQUE (name, email, number, department);
ALTER TABLE members ADD CONSTRAINT unique_name_number_department UNIQUE (name, number, department);
ALTER TABLE members ADD CONSTRAINT unique_name_email_department UNIQUE (name, email, department);
ALTER TABLE members ADD CONSTRAINT unique_email_number_department UNIQUE (email, number, department);
ALTER TABLE members ADD CONSTRAINT unique_number_department UNIQUE (number, department);
ALTER TABLE members ADD CONSTRAINT unique_email_department UNIQUE (email, department);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    email VARCHAR(80) NOT NULL,
    password VARCHAR(80) NOT NULL,
    role VARCHAR(20) NOT NULL,
    UNIQUE (email)
);