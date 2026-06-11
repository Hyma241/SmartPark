# Smart Parking Detection System

A production-ready AI-powered Smart Parking System using YOLOv8, FastAPI, React, and Firebase.

## Features
- **Real-Time Detection**: YOLOv8 continuously monitors RTSP CCTV streams.
- **Occupancy Engine**: Automatically maps detected vehicles to parking slot polygons.
- **Admin Dashboard**: Live statistics, camera management, and analytics.
- **Customer QR Portal**: Public, login-free page for customers to check available parking.
- **Dockerized**: One-command `docker-compose up` deployment.

## Architecture
- `frontend/`: React 19, Vite, Vanilla CSS.
- `backend/`: FastAPI, OpenCV, Ultralytics YOLOv8.
- `firebase/`: Configuration for Firestore and Auth.

## Getting Started
To run locally using Docker:
```bash
docker-compose up --build
```
The frontend will be available at http://localhost
The backend API will be at http://localhost:8000
