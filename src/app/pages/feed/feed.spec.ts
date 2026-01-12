import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedComponent } from './feed';
import { CommonModule } from '@angular/common';

describe('FeedComponent', () => {
  let component: FeedComponent;
  let fixture: ComponentFixture<FeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedComponent, CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the feed component', () => {
      expect(component).toBeTruthy();
    });

    it('should load 3 initial posts on init', () => {
      expect(component.posts.length).toBe(3);
    });

    it('should initialize with correct post authors', () => {
      expect(component.posts[0].author).toBe('Sophie Durand');
      expect(component.posts[1].author).toBe('Sophie Durand');
      expect(component.posts[2].author).toBe('Marc Pierre');
    });

    it('should initialize current tab as post', () => {
      expect(component.currentTab).toBe('post');
    });

    it('should have trending tags array', () => {
      expect(component.trendingTags.length).toBe(5);
      expect(component.trendingTags).toContain('#Football');
    });
  });

  describe('Post Management', () => {
    it('should return correct post count', () => {
      expect(component.getPostCount()).toBe(3);
    });

    it('should have posts with correct content', () => {
      expect(component.posts[0].content).toContain('match incroyable');
      expect(component.posts[2].content).toContain('Italie');
    });

    it('should have posts with tags', () => {
      expect(component.posts[0].tags).toContain('#Football');
      expect(component.posts[2].tags).toContain('#Voyage');
    });

    it('should have correct initial likes and comments', () => {
      expect(component.posts[0].likes).toBe(218);
      expect(component.posts[0].comments).toBe(38);
      expect(component.posts[2].likes).toBe(392);
    });
  });

  describe('Post Creation', () => {
    it('should add a new post when handlePostSubmit is called', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = 'New test post';
      component.handlePostSubmit();
      expect(component.getPostCount()).toBe(4);
    });

    it('should add new post at the beginning', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = 'First post';
      component.handlePostSubmit();
      expect(component.posts[0].author).toBe('Alex Martin');
    });

    it('should clear input after posting', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = 'Test post';
      component.handlePostSubmit();
      expect(postInput.value).toBe('');
    });

    it('should extract hashtags from content', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = 'Amazing day #Travel #Adventure';
      component.handlePostSubmit();
      expect(component.posts[0].tags).toContain('#Travel');
      expect(component.posts[0].tags).toContain('#Adventure');
    });

    it('should assign correct author to new posts', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = 'Test';
      component.handlePostSubmit();
      expect(component.posts[0].author).toBe('Alex Martin');
    });

    it('should prevent posting with empty content', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      const initialCount = component.getPostCount();
      postInput.value = '   ';
      component.handlePostSubmit();
      expect(component.getPostCount()).toBe(initialCount);
    });

    it('should set new post likes and comments to 0', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = 'Test post';
      component.handlePostSubmit();
      expect(component.posts[0].likes).toBe(0);
      expect(component.posts[0].comments).toBe(0);
    });
  });

  describe('Post Button State', () => {
    it('should disable post button on empty input', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = '';
      component.onPostInput();
      const postBtn = document.getElementById('postBtn') as HTMLButtonElement;
      expect(postBtn.disabled).toBe(true);
    });

    it('should enable post button with content', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = 'Test post content';
      component.onPostInput();
      const postBtn = document.getElementById('postBtn') as HTMLButtonElement;
      expect(postBtn.disabled).toBe(false);
    });

    it('should disable button for whitespace only', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = '     ';
      component.onPostInput();
      const postBtn = document.getElementById('postBtn') as HTMLButtonElement;
      expect(postBtn.disabled).toBe(true);
    });
  });

  describe('Like Functionality', () => {
    it('should increment likes when onLikePost is called', () => {
      const initialLikes = component.posts[0].likes;
      component.onLikePost(component.posts[0]);
      expect(component.posts[0].likes).toBe(initialLikes + 1);
    });

    it('should handle multiple likes', () => {
      component.onLikePost(component.posts[0]);
      component.onLikePost(component.posts[0]);
      component.onLikePost(component.posts[0]);
      expect(component.posts[0].likes).toBe(221);
    });

    it('should update total likes correctly', () => {
      const initialFirstPostLikes = component.posts[0].likes;
      component.onLikePost(component.posts[0]);
      expect(component.posts[0].likes).toBe(initialFirstPostLikes + 1);
    });
  });

  describe('Comment Functionality', () => {
    it('should call onCommentPost without error', () => {
      expect(() => {
        component.onCommentPost(component.posts[0]);
      }).not.toThrow();
    });
  });

  describe('Tab Switching', () => {
    it('should update current tab when switchTabUI is called', () => {
      component.switchTabUI('message');
      expect(component.currentTab).toBe('message');
    });

    it('should update current tab back to post', () => {
      component.switchTabUI('message');
      component.switchTabUI('post');
      expect(component.currentTab).toBe('post');
    });
  });

  describe('Hashtag Functionality', () => {
    it('should handle hashtag click', () => {
      expect(() => {
        component.onHashtagClick('#Football');
      }).not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should calculate correct post count', () => {
      expect(component.getPostCount()).toBe(3);
    });

    it('should calculate total likes correctly', () => {
      const total = component.getTotalLikes();
      expect(total).toBe(755); // 218 + 145 + 392
    });

    it('should calculate total comments correctly', () => {
      const total = component.getTotalComments();
      expect(total).toBe(128); // 38 + 23 + 67
    });

    it('should update statistics after new post', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = 'New post';
      component.handlePostSubmit();
      expect(component.getPostCount()).toBe(4);
    });

    it('should update total likes after liking', () => {
      const initialTotal = component.getTotalLikes();
      component.onLikePost(component.posts[0]);
      expect(component.getTotalLikes()).toBe(initialTotal + 1);
    });
  });

  describe('Post Ordering', () => {
    it('should maintain newest posts first', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = 'First post';
      component.handlePostSubmit();
      postInput.value = 'Second post';
      component.handlePostSubmit();

      expect(component.posts[0].content).toBe('Second post');
      expect(component.posts[1].content).toBe('First post');
    });
  });

  describe('Data Integrity', () => {
    it('should maintain all required post properties', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = 'Test post';
      component.handlePostSubmit();
      const newPost = component.posts[0];

      expect(newPost.id).toBeDefined();
      expect(newPost.author).toBe('Alex Martin');
      expect(newPost.avatar).toBe('👤');
      expect(newPost.time).toBe('just now');
      expect(newPost.content).toBe('Test post');
      expect(Array.isArray(newPost.tags)).toBe(true);
      expect(newPost.likes).toBe(0);
      expect(newPost.comments).toBe(0);
    });

    it('should not modify original posts when creating new one', () => {
      const originalCount = component.posts.length;
      const firstPostLikes = component.posts[0].likes;

      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = 'Test';
      component.handlePostSubmit();

      expect(component.posts[1].likes).toBe(firstPostLikes);
      expect(component.posts.length).toBe(originalCount + 1);
    });
  });

  describe('Input Validation', () => {
    it('should handle posts with special characters', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = 'Test! @#$%^&*() Post? 👍';
      component.handlePostSubmit();
      expect(component.posts[0].content).toBe('Test! @#$%^&*() Post? 👍');
    });

    it('should handle multiple hashtags correctly', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = '#First #Second #Third #Fourth';
      component.handlePostSubmit();
      expect(component.posts[0].tags.length).toBe(4);
    });

    it('should handle posts with no hashtags', () => {
      const postInput = document.getElementById('postInput') as HTMLTextAreaElement;
      postInput.value = 'Simple post without any tags';
      component.handlePostSubmit();
      expect(component.posts[0].tags.length).toBe(0);
    });
  });
});
