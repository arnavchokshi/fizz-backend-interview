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

`TODO`: When you're done, please update this README with your thoughts on the following questions:
- At a high level, how would you describe your approach to this challenge?
- Did you use any AI tools to help you with this challenge? How did they help you? What worked well and what didn't?


## Approach

**High-Level Approach:**
I started by researching common practices for social media architectures. Then using cursors plan feature I started thinking about each API service we would need and its appropriate data models we would use. Then I finally created additional pieces such as middleware files, indexes, error catches etc. to optimize and clarify approach.

**AI Tools Usage:**
I used AI tools primarily for initial architecture design and later for code review. ChatGPT helped me quickly reseach how current social media platforms have based their architecture as well as understand Drizzle ORM patterns. After building the base implementation, I used Cursor to review parts of the code for edge cases and add error logs.

**What worked well:**
- Fast iteration on database schema
- Quickly generated content valdiation code (It is great for creating code when given documentation)
- Helped me transfer existing code to using Drizzle ORM 
- Automated edge case detection and error handling improvements
- Helped me quickly make an instalation guide (although I had to review it and cut it down as it went overboard on detail)

**What didn't work well:**
- Sometimes added unnecessary indexes (really bad for storage managment) or created an overly complex solution
- Occasionally included redundant validation checks and did not take full context of other files validations
- Required careful review to ensure AI suggestions aligned with the actual requirements

**Improvemnets if given more time**
As the backend was running SQLlite and I didnt want to go overboard, I decided not to use a redis cache for posts, and limitied redis to only caching rate limits. Also, if given more data, it would be really fun to come up with a more advanced feed algorithm. I would also spend more time creating better content moderation.



**Setup & Running**

## 🔗 Links

- **GitHub Repository**: [https://github.com/arnavchokshi/fizz-backend-interview](https://github.com/arnavchokshi/fizz-backend-interview)
- **Docker Hub**: [https://hub.docker.com/r/achokshi38/fizz-interview-backend](https://hub.docker.com/r/achokshi38/fizz-interview-backend)

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

### Schools
- `POST /schools` - Create a new school
  - Body: `{ "name": "string" }`
  - Returns: School object

### Users
- `POST /users` - Create a new user
  - Body: `{ "name": "string", "schoolId": number }`
  - Returns: User object
  
- `GET /users/:id` - Get a user by ID
  - Returns: User object

### Posts
- `POST /posts` - Create a new post
  - Body: `{ "userId": number, "content": "string", "mediaUrl": "string" (optional) }`
  - Returns: Post object
  
- `GET /posts/:id` - Get a post and all its comments (paginated)
  - Query params: `limit` (optional, default: 30), `cursor` (optional, timestamp for pagination)
  - Returns: Post object with comments array and pagination info (`comments_next_cursor`, `comments_has_more`)

### Comments
- `POST /comments` - Create a new comment
  - Body: `{ "userId": number, "postId": number, "content": "string", "mediaUrl": "string" (optional) }`
  - Returns: Comment object

### Feed
- `GET /feed/newest` - Get newest feed (time-based, paginated)
  - Query params: `userId` (required), `limit` (optional, default: 30), `cursor` (optional, timestamp for pagination)
  - Returns: Feed object with posts array, `next_cursor`, and `preload_hint`
  - Note: userId is used to determine which school's feed to show
  
- `GET /feed/trending` - Get trending feed (algorithm-based)
  - Query params: `userId` (required)
  - Returns: Feed object with posts array
  - Note: userId is used to determine which school's feed to show