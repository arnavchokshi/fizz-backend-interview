# Push to Docker Hub Instructions

## Step 1: Create Repository on Docker Hub (if not exists)
1. Go to https://hub.docker.com/repositories/create
2. Repository name: `fizz-interview-backend`
3. Choose visibility (Public or Private)
4. Click "Create"

## Step 2: Login to Docker Hub
```bash
docker login
```
Enter your Docker Hub username (`achokshi38`) and password.

## Step 3: Tag the Image (if not already tagged)
```bash
docker tag fizz-interview-backend:latest achokshi38/fizz-interview-backend:latest
```

## Step 4: Push to Docker Hub
```bash
docker push achokshi38/fizz-interview-backend:latest
```

## Alternative: Use the Script
After creating the repository and logging in:
```bash
./push-to-dockerhub.sh achokshi38
```

## Verify the Push
Check your repository at:
https://hub.docker.com/r/achokshi38/fizz-interview-backend

## Pull the Image (from anywhere)
```bash
docker pull achokshi38/fizz-interview-backend:latest
```

