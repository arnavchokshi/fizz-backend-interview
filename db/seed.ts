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
      upvotes: number;
      downvotes: number;
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

      // Upvote distribution:
      // 50% of posts: 0-750 upvotes
      // 25% of posts: 750-1.5k upvotes
      // 25% of posts: 1.5k-2.5k upvotes
      const upvoteRandom = Math.random();
      let upvotes: number;
      if (upvoteRandom < 0.5) {
        // 50%: 0-750 upvotes
        upvotes = Math.floor(Math.random() * 751);
      } else if (upvoteRandom < 0.75) {
        // 25%: 750-1.5k upvotes
        upvotes = Math.floor(750 + Math.random() * 751);
      } else {
        // 25%: 1.5k-2.5k upvotes
        upvotes = Math.floor(1500 + Math.random() * 1001);
      }

      // Downvotes are typically a small percentage of upvotes (0-5% with some variation)
      const downvoteRatio = Math.random() * 0.05; // 0-5% of upvotes
      const downvotes = Math.floor(upvotes * downvoteRatio + Math.random() * 10);

      // Comment distribution:
      // 40% of posts: 0 comments
      // 40% of posts: 2-3 comments
      // 20% of posts: 8+ comments
      const commentRandom = Math.random();
      let commentsCount: number;
      if (commentRandom < 0.4) {
        // 40%: 0 comments
        commentsCount = 0;
      } else if (commentRandom < 0.8) {
        // 40%: 2-3 comments
        commentsCount = Math.floor(2 + Math.random() * 2); // 2 or 3
      } else {
        // 20%: 8+ comments (let's make it 8-15 for realism)
        commentsCount = Math.floor(8 + Math.random() * 8); // 8-15
      }

      const content = postTemplates[Math.floor(Math.random() * postTemplates.length)] + ` #${i}`;
      const mediaUrl = mediaUrls[Math.floor(Math.random() * mediaUrls.length)];

      postsData.push({
        id: i,
        userId,
        schoolId,
        content,
        mediaUrl,
        createdAt,
        upvotes,
        downvotes,
        commentsCount,
      });
    }

    // Insert posts in batches to avoid SQLite variable limit
    const postBatchSize = 100; // Insert 100 posts at a time
    for (let i = 0; i < postsData.length; i += postBatchSize) {
      const batch = postsData.slice(i, i + postBatchSize);
      await db.insert(posts).values(batch);
    }

    // Create comments - more realistic Fizz-style comments
    const commentTemplates = [
      'facts',
      'fr',
      'same',
      'this',
      'lol',
      'dead',
      'accurate',
      'facts bro',
      'nah',
      'cap',
      'yup',
      'agree',
      'true',
      'so real',
      'literally',
      'ngl',
      'fair',
      'valid',
      'fr fr',
      'on god',
      'this is so real',
      'big facts',
      'no cap',
      'say less',
      'period',
      'exactly',
      '100%',
      'preach',
      'yesss',
      'couldn\'t agree more',
    ];

    const commentsData: Array<{
      id: number;
      postId: number;
      userId: number;
      content: string;
      mediaUrl: string | null;
      createdAt: number;
      upvotes: number;
      downvotes: number;
    }> = [];

    let commentId = 1;
    for (const post of postsData) {
      const numComments = post.commentsCount || 0;
      
      // Only generate comments if the post has comments
      for (let i = 0; i < numComments; i++) {
        // Ensure commenter is different from post author (with some randomness)
        let commenterId = ((commentId - 1) % 8) + 1;
        if (commenterId === post.userId) {
          commenterId = ((commenterId) % 8) + 1;
        }
        
        const content = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
        
        // Comments are created within a few days after the post (more recent posts get comments faster)
        // Ensure comment is not created in the future
        const maxDaysAfterPost = Math.min(7, (now - post.createdAt) / oneDay);
        const daysAfterPost = Math.random() * maxDaysAfterPost;
        const maxHoursAfterPost = Math.min(24, (now - (post.createdAt + daysAfterPost * oneDay)) / oneHour);
        const hoursAfterPost = Math.random() * maxHoursAfterPost;
        const commentCreatedAt = Math.min(
          post.createdAt + (daysAfterPost * oneDay + hoursAfterPost * oneHour),
          now
        );
        
        // Comment upvotes are typically much lower than post upvotes
        // Most comments get 0-30 upvotes, with occasional higher ones on popular posts
        // Comments on very popular posts (1.5k+ upvotes) have a higher chance of more upvotes
        let commentUpvotes: number;
        if (post.upvotes >= 1500) {
          // High engagement posts: comments can get 5-50 upvotes
          commentUpvotes = Math.floor(5 + Math.random() * 46);
        } else if (post.upvotes >= 750) {
          // Medium engagement posts: comments can get 2-25 upvotes
          commentUpvotes = Math.floor(2 + Math.random() * 24);
        } else {
          // Lower engagement posts: comments typically get 0-15 upvotes
          commentUpvotes = Math.floor(Math.random() * 16);
        }
        
        // Comments rarely have downvotes, but if they do, it's minimal (0-3)
        const commentDownvotes = Math.random() < 0.15 ? Math.floor(Math.random() * 4) : 0;

        commentsData.push({
          id: commentId++,
          postId: post.id,
          userId: commenterId,
          content,
          mediaUrl: null,
          createdAt: commentCreatedAt,
          upvotes: commentUpvotes,
          downvotes: commentDownvotes,
        });
      }
    }

    // Insert comments in batches to avoid SQLite variable limit
    if (commentsData.length > 0) {
      const batchSize = 100; // Insert 100 comments at a time
      for (let i = 0; i < commentsData.length; i += batchSize) {
        const batch = commentsData.slice(i, i + batchSize);
        await db.insert(comments).values(batch);
      }
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
