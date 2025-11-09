# Fizz Interview Challenge - Backend

The is a skeleton project that contains an express server and a sqllite database. The overall objective is to create the backend to power a stripped down version of Fizz.

Your goal is to create a set of APIs that allow for:

- add/create a user (no password needed)
- creating posts
- creating comments
- getting a feed (list of sorted posts)
- getting a post and all its comments

You can imagine the client using these APIs to power the app.
We are not interested in a login / authentication system so when adding a user there is no password needed. This API simply allows for a User model.

When getting the feed you are free to implement any ranking algorithm / mechanism.

When evaluating your solution we are interested in:
- how you structure your code
- data structures and abstractions you use
- cleanliness and correctness
- your overall approach to building the project

Please read TODOs in **all files** and finish TODOs. When you are finished, send us your completed project in the form of a zip file. There is no need to write any tests for this interview purposes.


## Approach

**High-Level Approach:**
I structured the solution using a service layer architecture with clear separation of concerns. The application follows a three-tier architecture: route handlers (server.ts), service layer (business logic), and database layer (Drizzle ORM). Key design decisions include:
- Service-based architecture for maintainability and testability
- Middleware for cross-cutting concerns (rate limiting, validation, user authentication)
- Cursor-based pagination for efficient feed retrieval
- Composite indexes on frequently queried columns (schoolId + createdAt for posts)
- Two feed algorithms: time-based (newest) and engagement-based (trending using votes and comments)
- Consistent error handling with structured error responses
- Type-safe database queries using Drizzle ORM with TypeScript

**AI Tools Usage:**
I used AI tools primarily for initial architecture design and later for code review. ChatGPT helped me quickly design the service layer structure and understand Drizzle ORM patterns. After building the base implementation, I used Cursor to systematically review the codebase for edge cases and add comprehensive error messaging.

**What worked well:**
- Fast iteration on database schema and service patterns
- Quick generation of boilerplate code and data seeding scripts
- Automated edge case detection and error handling improvements

**What didn't work well:**
- Sometimes added unnecessary indexes or outdated patterns (promises instead of async/await)
- Occasionally included redundant validation checks without full context
- Required careful review to ensure AI suggestions aligned with the actual requirements





## Setup & Running

### Prerequisites
- Have Docker Desktop installed and open

### Installation

1. Start the application:
```bash
docker-compose up -d
```

This will start both Redis and the Node.js app in Docker containers.

2. Seed the database with sample data:
```bash
docker exec -it fizz-app npm run seed
```

The server will be accessible at `http://localhost:3000`

### Connect to Redis CLI (interactive)
```bash
docker exec -it fizz-redis redis-cli
```

## API Endpoints

- `POST /users` - Create a new user
- `POST /posts` - Create a new post
- `POST /comments` - Create a new comment
- `GET /feed/newest?userId=X&limit=30&cursor=<timestamp>` - Get newest feed (userId is used to determine which school's feed to show)
- `GET /feed/trending?userId=X` - Get trending feed (userId is used to determine which school's feed to show)
- `GET /posts/:id` - Get a post and all its comments