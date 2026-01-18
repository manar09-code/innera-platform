import * as admin from 'firebase-admin';

// Initialize Firebase Admin (assuming it's already initialized in index.ts)
const db = admin.firestore();

interface Post {
  author: string;
  avatar: string;
  content: string;
  time: admin.firestore.Timestamp;
  likes: number;
  comments: Comment[];
  tags: string[];
  type: string;
  likedBy: string[];
  userId: string;
  communityName: string;
  isPinned?: boolean;
}

interface Comment {
  id: string;
  username: string;
  text: string;
  time: admin.firestore.Timestamp;
  userId: string;
}

const samplePosts: Omit<Post, 'time'>[] = [
  {
    author: 'Ahmed Ben Ali',
    avatar: 'A',
    content: 'Welcome to our Tunisian community! Excited to share experiences and connect with everyone. #Tunisia #Community',
    likes: 12,
    comments: [],
    tags: ['Tunisia', 'Community'],
    type: 'text',
    likedBy: [],
    userId: 'ahmed@example.com',
    communityName: 'Innera Platform',
    isPinned: true
  },
  {
    author: 'Fatima Trabelsi',
    avatar: 'F',
    content: 'Just tried the most amazing couscous recipe from my grandmother. Traditional Tunisian flavors never disappoint! 🍲🇹🇳',
    likes: 8,
    comments: [],
    tags: ['TunisianFood', 'Couscous'],
    type: 'text',
    likedBy: [],
    userId: 'fatima@example.com',
    communityName: 'Innera Platform'
  },
  {
    author: 'Mohamed Saidi',
    avatar: 'M',
    content: 'Beautiful sunset at Hammamet beach today. Tunisia has the most stunning coastlines! 🏖️',
    likes: 15,
    comments: [],
    tags: ['Hammamet', 'BeachLife'],
    type: 'text',
    likedBy: [],
    userId: 'mohamed@example.com',
    communityName: 'Innera Platform'
  },
  {
    author: 'Leila Mansouri',
    avatar: 'L',
    content: 'Exploring the historic medina in Tunis. The architecture and culture here are incredible! 🕌',
    likes: 6,
    comments: [],
    tags: ['Tunis', 'Culture'],
    type: 'text',
    likedBy: [],
    userId: 'leila@example.com',
    communityName: 'Innera Platform'
  },
  {
    author: 'Youssef Gharbi',
    avatar: 'Y',
    content: 'Great community meeting today! Discussed ways to preserve our Tunisian heritage and traditions.',
    likes: 9,
    comments: [],
    tags: ['TunisianCulture', 'Heritage'],
    type: 'text',
    likedBy: [],
    userId: 'youssef@example.com',
    communityName: 'Innera Platform'
  }
];

async function seedPosts() {
  try {
    console.log('Starting to seed posts...');

    for (const postData of samplePosts) {
      const postWithTime = {
        ...postData,
        time: admin.firestore.Timestamp.now()
      };

      await db.collection('posts').add(postWithTime);
      console.log(`Added post by ${postData.author}`);
    }

    console.log('Successfully seeded all posts!');
  } catch (error) {
    console.error('Error seeding posts:', error);
  }
}

// Export for use in other files
export { seedPosts };

// If run directly
if (require.main === module) {
  seedPosts();
}
