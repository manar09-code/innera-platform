import { Injectable } from '@angular/core';
import { PostService } from './post.service';

@Injectable({
  providedIn: 'root'
})
export class SeedService {

  constructor(private postService: PostService) { }

  async seedInitialPosts(communityName: string) {
    const samplePosts = [
      {
        author: 'Ahmed Ben Ali',
        avatar: 'A',
        content: 'Welcome to our Tunisian community! Excited to share experiences and connect with everyone. #Tunisia #Community',
        tags: ['Tunisia', 'Community'],
        type: 'text',
        userId: 'ahmed@example.com',
        communityName: communityName,
        isPinned: true,
        authorRole: 'admin' as 'admin' | 'user'
      },
      {
        author: 'Fatima Trabelsi',
        avatar: 'F',
        content: 'Just tried the most amazing couscous recipe from my grandmother. Traditional Tunisian flavors never disappoint! 🍲🇹🇳',
        tags: ['TunisianFood', 'Couscous'],
        type: 'text',
        userId: 'fatima@example.com',
        communityName: communityName,
        authorRole: 'user' as 'admin' | 'user'
      },
      {
        author: 'Mohamed Saidi',
        avatar: 'M',
        content: 'Beautiful sunset at Hammamet beach today. Tunisia has the most stunning coastlines! 🏖️',
        tags: ['Hammamet', 'BeachLife'],
        type: 'text',
        userId: 'mohamed@example.com',
        communityName: communityName,
        authorRole: 'user' as 'admin' | 'user'
      },
      {
        author: 'Leila Mansouri',
        avatar: 'L',
        content: 'Exploring the historic medina in Tunis. The architecture and culture here are incredible! 🕌',
        tags: ['Tunis', 'Culture'],
        type: 'text',
        userId: 'leila@example.com',
        communityName: communityName,
        authorRole: 'user' as 'admin' | 'user'
      },
      {
        author: 'Youssef Gharbi',
        avatar: 'Y',
        content: 'Great community meeting today! Discussed ways to preserve our Tunisian heritage and traditions.',
        tags: ['TunisianCulture', 'Heritage'],
        type: 'text',
        userId: 'youssef@example.com',
        communityName: communityName,
        authorRole: 'user' as 'admin' | 'user'
      }
    ];

    try {
      console.log('Seeding initial posts...');
      for (const post of samplePosts) {
        await this.postService.createPost(post);
        console.log(`Created post by ${post.author}`);
      }
      console.log('Successfully seeded all posts!');
      return true;
    } catch (error) {
      console.error('Error seeding posts:', error);
      return false;
    }
  }
}
