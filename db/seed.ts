import { db } from './db';
import { schools, users, posts, comments } from './schema';
import { initDb } from './db';

/**
 * Seed the database with sample data for testing
 * Includes schools, users, posts, and comments
 */
export async function seedDatabase() {
  // Initialize database (creates tables if they don't exist)
  await initDb();

  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  try {
    // Clear existing data
    await db.delete(comments);
    await db.delete(posts);
    await db.delete(users);
    await db.delete(schools);

    // Create schools
    await db.insert(schools).values([
      { id: 1, name: 'Stanford University' },
      { id: 2, name: 'MIT' },
      { id: 3, name: 'Harvard University' },
    ]);

    // Create users
    const usersData = [
      { id: 1, name: 'Alice Johnson', schoolId: 1, createdAt: now - 30 * oneDay },
      { id: 2, name: 'Bob Smith', schoolId: 1, createdAt: now - 25 * oneDay },
      { id: 3, name: 'Charlie Brown', schoolId: 1, createdAt: now - 20 * oneDay },
      { id: 4, name: 'Diana Prince', schoolId: 2, createdAt: now - 15 * oneDay },
      { id: 5, name: 'Eve Wilson', schoolId: 2, createdAt: now - 10 * oneDay },
      { id: 6, name: 'Frank Miller', schoolId: 2, createdAt: now - 5 * oneDay },
      { id: 7, name: 'Grace Lee', schoolId: 3, createdAt: now - 3 * oneDay },
      { id: 8, name: 'Henry Davis', schoolId: 3, createdAt: now - 2 * oneDay },
    ];

    await db.insert(users).values(usersData);

    // Create posts
    const postTemplates = [
      'Just finished my project! 🎉',
      'Check out this cool thing I built',
      'Looking for study partners',
      'Campus looks beautiful today',
      'Midterm season is here... good luck everyone!',
      'Just published my research paper!',
      'Coffee shop recommendations?',
      'New student orientation was fantastic!',
      'Working on something exciting',
      'Need help with this assignment',
      'Great day on campus',
      'Anyone else procrastinating?',
      'Study session was productive',
      'Found the best study spot',
      'Finished my first hackathon!',
      'Check out this event happening',
      'Beautiful weather today',
      'Working late in the library',
      'Group project meeting went well',
      'Excited for the weekend',
    ];

    const mediaUrls = [
      null,
      null,
      null,
      null,
      null,
      'https://example.com/media/post1.jpg',
      'https://example.com/media/post2.jpg',
      'https://example.com/media/post3.jpg',
    ];

    const postsData: Array<{
      id: number;
      userId: number;
      schoolId: number;
      content: string;
      mediaUrl: string | null;
      createdAt: number;
      votes: number;
      commentsCount: number;
    }> = [];

    const numPosts = 500;
    const maxDaysAgo = 30;

    for (let i = 1; i <= numPosts; i++) {
      const userId = ((i - 1) % 8) + 1;
      const schoolId = userId <= 3 ? 1 : userId <= 6 ? 2 : 3;

      const daysAgo = Math.pow(Math.random(), 2) * maxDaysAgo;
      const hoursAgo = Math.random() * 24;
      const createdAt = now - (daysAgo * oneDay + hoursAgo * oneHour);

      const recencyFactor = Math.max(0, 1 - daysAgo / maxDaysAgo);
      const baseVotes = Math.floor(Math.random() * 100) - 20;
      const votes = Math.floor(baseVotes * (0.3 + 0.7 * recencyFactor) + Math.random() * 20);

      const commentsCount = Math.floor(Math.max(0, votes) * (0.2 + Math.random() * 0.2));

      const content = postTemplates[Math.floor(Math.random() * postTemplates.length)] + ` #${i}`;
      const mediaUrl = mediaUrls[Math.floor(Math.random() * mediaUrls.length)];

      postsData.push({
        id: i,
        userId,
        schoolId,
        content,
        mediaUrl,
        createdAt,
        votes,
        commentsCount: Math.max(0, commentsCount),
      });
    }

    await db.insert(posts).values(postsData);

    // Create comments
    const commentTemplates = [
      'Congrats!',
      'Well done! 🎉',
      'Amazing work!',
      'That sounds great!',
      'I agree!',
      'Nice!',
      'Keep it up!',
      'Awesome!',
      'Great job!',
      'Love this!',
    ];

    const commentsData: Array<{
      id: number;
      postId: number;
      userId: number;
      content: string;
      mediaUrl: string | null;
      createdAt: number;
      votes: number;
    }> = [];

    let commentId = 1;
    for (const post of postsData) {
      const numComments = post.commentsCount || 0;
      for (let i = 0; i < numComments && i < 20; i++) {
        const commenterId = ((commentId - 1) % 8) + 1;
        const content = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
        const hoursAfterPost = Math.random() * Math.min(24, (now - post.createdAt) / oneHour);
        const commentCreatedAt = post.createdAt + hoursAfterPost * oneHour;
        const commentVotes = Math.floor(Math.random() * 50) - 10;

        commentsData.push({
          id: commentId++,
          postId: post.id,
          userId: commenterId,
          content,
          mediaUrl: null,
          createdAt: commentCreatedAt,
          votes: commentVotes,
        });
      }
    }

    if (commentsData.length > 0) {
      await db.insert(comments).values(commentsData);
    }

    console.log('✅ Database seeded successfully!');
    console.log(`   - ${usersData.length} users`);
    console.log(`   - ${postsData.length} posts`);
    console.log(`   - ${commentsData.length} comments`);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error seeding database:', err);
      process.exit(1);
    });
}
