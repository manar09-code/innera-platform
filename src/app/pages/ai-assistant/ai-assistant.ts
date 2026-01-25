// This file is located in the src/app/pages folder, which contains page components that represent different views or routes in the application, such as home, feed, profile, etc. This file serves as the AI assistant component. Its role is to provide an interactive AI-powered chat assistant that helps users with community-related questions and navigation. It interacts with PostService for feed data, ConfigService for AI configuration, AiService for generating responses, and other services for user context.
import { // This line starts the import statement for Angular core decorators and interfaces.
  Component, // This line imports the Component decorator, which is needed to define the component metadata.
  OnInit, // This line imports the OnInit interface, which is needed for lifecycle hook initialization.
  AfterViewChecked, // This line imports the AfterViewChecked interface, which is needed for lifecycle hook after view checks.
  ElementRef, // This line imports the ElementRef class, which is needed for DOM element references.
  ViewChild, // This line imports the ViewChild decorator, which is needed to query child elements in the template.
  Input, // This line imports the Input decorator, which is needed to receive data from parent components.
  OnDestroy // This line imports the OnDestroy interface, which is needed for lifecycle hook cleanup.
} from '@angular/core'; // This line specifies the module from which the imports are taken.
import { CommonModule } from '@angular/common'; // This line imports CommonModule, which provides common directives like *ngIf and *ngFor.
import { FormsModule } from '@angular/forms'; // This line imports FormsModule, which provides form directives like ngModel.
import { Router, NavigationEnd } from '@angular/router'; // This line imports Router and NavigationEnd, which are needed for routing and navigation events.
import { HttpClient } from '@angular/common/http'; // This line imports HttpClient, which is needed for making HTTP requests.
import { filter, Subscription } from 'rxjs'; // This line imports filter and Subscription from rxjs, which are needed for observable operations and subscription management.
import { httpsCallable } from 'firebase/functions'; // This line imports httpsCallable, which is needed for calling Firebase Cloud Functions.
import { functions } from '../../firebase.config'; // This line imports the configured functions instance from Firebase config.

import { PostService } from '../../services/post.service'; // This line imports PostService, which is needed to fetch post data for context.
import { ConfigService } from '../../services/config.service'; // This line imports ConfigService, which is needed to get AI configuration settings.
import { AiService } from '../../services/ai.service'; // This line imports AiService, which is needed to generate AI responses.

interface Message { // This line defines the Message interface, which specifies the structure of chat messages.
  text: string; // This line defines the text property, which is a string representing the message content.
  time: Date; // This line defines the time property, which is a Date representing when the message was sent.
  isUser: boolean; // This line defines the isUser property, which is a boolean indicating if the message is from the user.
} // This closes the Message interface.

interface FeedPostSummary { // This line defines the FeedPostSummary interface, which specifies the structure of summarized feed posts.
  author: string; // This line defines the author property, which is a string representing the post author.
  content: string; // This line defines the content property, which is a string representing the post content.
  time: Date; // This line defines the time property, which is a Date representing when the post was created.
  likes: number; // This line defines the likes property, which is a number representing the number of likes.
  comments: number; // This line defines the comments property, which is a number representing the number of comments.
  tags: string[]; // This line defines the tags property, which is an array of strings representing post tags.
} // This closes the FeedPostSummary interface.

@Component({ // This line applies the Component decorator to the class, defining the component metadata.
  selector: 'app-ai-assistant', // This line sets the selector to 'app-ai-assistant', which is the HTML tag name for this component.
  standalone: true, // This line sets standalone to true, meaning the component manages its own dependencies.
  imports: [CommonModule, FormsModule], // This line lists the modules imported by this component.
  templateUrl: './ai-assistant.html', // This line sets the templateUrl to './ai-assistant.html', which is the path to the component's HTML template.
  styleUrls: ['./ai-assistant.css'], // This line sets the styleUrls to ['./ai-assistant.css'], which is the path to the component's CSS styles.
}) // This closes the Component decorator.
export class AiAssistantComponent // This line exports the AiAssistantComponent class, which is the main component class for the AI assistant.
  implements OnInit, AfterViewChecked, OnDestroy { // This line specifies the interfaces implemented by the class for lifecycle hooks.

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef; // This line declares a ViewChild property messagesContainer, which references the messages container element in the template.
  @Input() currentPage: string = ''; // This line declares an Input property currentPage, which receives the current page from the parent component.
  @Input() userRole: string = ''; // This line declares an Input property userRole, which receives the user role from the parent component.

  isOpen = false; // This line declares a property isOpen, which is a boolean indicating if the chat is open.
  isLoading = false; // This line declares a property isLoading, which is a boolean indicating if a response is being loaded.
  userMessage = ''; // This line declares a property userMessage, which is a string holding the user's input message.
  messages: Message[] = []; // This line declares a property messages, which is an array of Message objects representing the chat history.

  private routerSubscription?: Subscription; // This line declares a private property routerSubscription, which is an optional Subscription for router events.

  constructor( // This line defines the constructor for the AiAssistantComponent class.
    private router: Router, // This line injects the Router service for navigation.
    private http: HttpClient, // This line injects the HttpClient service for HTTP requests.
    private postService: PostService, // This line injects the PostService for post data.
    private configService: ConfigService, // This line injects the ConfigService for configuration.
    private aiService: AiService // This line injects the AiService for AI responses.
  ) { } // This closes the constructor.

  /* -------------------- Lifecycle -------------------- */ // This line is a comment indicating the start of lifecycle methods.

  ngOnInit() { // This line defines the ngOnInit lifecycle method, which is called after the component is initialized.
    this.userRole = localStorage.getItem('userRole') || ''; // This line sets the userRole from local storage.
    this.currentPage = this.router.url.split('/')[1] || 'home'; // This line sets the currentPage from the router URL.

    this.routerSubscription = this.router.events // This line subscribes to router events.
      .pipe(filter(event => event instanceof NavigationEnd)) // This line filters for NavigationEnd events.
      .subscribe(() => { // This line subscribes to the filtered events.
        this.currentPage = this.router.url.split('/')[1] || 'home'; // This line updates the currentPage on navigation.
      }); // This closes the subscribe callback.
  } // This closes the ngOnInit method.

  ngOnDestroy() { // This line defines the ngOnDestroy lifecycle method, which is called before the component is destroyed.
    this.routerSubscription?.unsubscribe(); // This line unsubscribes from the router subscription if it exists.
  } // This closes the ngOnDestroy method.

  ngAfterViewChecked() { // This line defines the ngAfterViewChecked lifecycle method, which is called after the view is checked.
    this.scrollToBottom(); // This line calls the scrollToBottom method to scroll the messages container.
  } // This closes the ngAfterViewChecked method.

  /* -------------------- UI -------------------- */ // This line is a comment indicating the start of UI methods.

  toggleChat() { // This line defines the toggleChat method, which toggles the chat visibility.
    this.isOpen = !this.isOpen; // This line toggles the isOpen property.
    if (this.isOpen) { // This line checks if the chat is now open.
      setTimeout(() => this.scrollToBottom(), 100); // This line schedules a scroll to bottom after a delay.
    } // This closes the if block.
  } // This closes the toggleChat method.

  /* -------------------- Core Logic -------------------- */ // This line is a comment indicating the start of core logic methods.

  async sendMessage() { // This line defines the async sendMessage method, which sends a user message and gets an AI response.
    if (!this.userMessage.trim() || this.isLoading) return; // This line checks if the message is empty or loading, and returns early if so.

    const message = this.userMessage.trim(); // This line trims the user message.
    this.userMessage = ''; // This line clears the user message input.
    this.isLoading = true; // This line sets the loading state to true.

    // Add user message // This line is a comment indicating the addition of the user message.
    this.messages.push({ // This line pushes a new message to the messages array.
      text: message, // This line sets the text to the user's message.
      time: new Date(), // This line sets the time to the current date.
      isUser: true, // This line sets isUser to true.
    }); // This closes the push call.

    try { // This line starts a try block for error handling.
      // Always fetch latest admin instructions and news // This line is a comment indicating fetching config.
      const config = await this.configService.getConfig(); // This line fetches the configuration from the config service.

      if (!config.openaiKey) { // This line checks if the OpenAI key is not configured.
        this.messages.push({ // This line pushes an error message to the chat.
          text: 'AI Assistant is not configured. Please ask the admin to provide a Gemini API Key in the "Config AI" page.', // This line sets the error text.
          time: new Date(), // This line sets the time.
          isUser: false, // This line sets isUser to false.
        }); // This closes the push call.
        return; // This line returns early.
      } // This closes the if block.

      // ✅ Build context and call AI // This line is a comment indicating building context and calling AI.
      const context = await this.buildContext(config); // This line builds the context using the config.

      const reply = await this.aiService.getChatResponse(message, context, config.openaiKey); // This line gets the AI response.

      this.messages.push({ // This line pushes the AI response to the messages.
        text: reply || 'Sorry, I could not generate a response.', // This line sets the text to the reply or a default message.
        time: new Date(), // This line sets the time.
        isUser: false, // This line sets isUser to false.
      }); // This closes the push call.

    } catch (error: any) { // This line starts a catch block for errors.
      console.error('AI Assistant error:', error); // This line logs the error.
      const errorMsg = error.message || 'Unknown error'; // This line gets the error message.
      this.messages.push({ // This line pushes an error message to the chat.
        text: `Sorry, something went wrong: ${errorMsg}. Please try again later.`, // This line sets the error text.
        time: new Date(), // This line sets the time.
        isUser: false, // This line sets isUser to false.
      }); // This closes the push call.
    } finally { // This line starts a finally block.
      this.isLoading = false; // This line sets the loading state to false.
    } // This closes the finally block.
  } // This closes the sendMessage method.

  /* -------------------- Helpers -------------------- */ // This line is a comment indicating the start of helper methods.

  private isCommunityQuestion(message: string): boolean { // This line defines the private isCommunityQuestion method, which checks if a message is a community-related question.
    const keywords = [ // This line defines an array of keywords related to community questions.
      'community', // This line is a keyword.
      'tunisia hood', // This line is a keyword.
      'post', // This line is a keyword.
      'feed', // This line is a keyword.
      'comment', // This line is a keyword.
      'member', // This line is a keyword.
      'rules', // This line is a keyword.
      'guidelines', // This line is a keyword.
      'learning', // This line is a keyword.
      'resource', // This line is a keyword.
      'admin', // This line is a keyword.
      'platform' // This line is a keyword.
    ]; // This closes the keywords array.

    const lower = message.toLowerCase(); // This line converts the message to lowercase.
    return keywords.some(k => lower.includes(k)); // This line checks if any keyword is included in the message.
  } // This closes the isCommunityQuestion method.

  private async buildContext(config: { instructions: string; news: string }): Promise<any> { // This line defines the private async buildContext method, which builds context for the AI response.
    const userEmail = localStorage.getItem('userEmail') || ''; // This line gets the user email from local storage.
    const communityName = localStorage.getItem('communityName') || ''; // This line gets the community name from local storage.

    let feedPosts: FeedPostSummary[] = []; // This line initializes an array for feed post summaries.
    let communityMetrics = null; // Placeholder for aggregated stats
    let popularPosts: any[] = []; // Placeholder for popular posts
    let activeAuthors: any[] = []; // Placeholder for active members

    try { // This line starts a try block for error handling.
      // Load real statistics for AI grounding
      communityMetrics = await this.postService.getCommunityStats(communityName); // Fetches community statistics.
      popularPosts = await this.postService.getPopularPosts(communityName); // Fetches popular posts.
      activeAuthors = await this.postService.getActiveAuthors(communityName); // Fetches active authors.

      const posts = await this.postService.getPosts(communityName); // This line fetches posts from the post service.
      feedPosts = posts.slice(0, 10).map((post: any) => ({ // This line maps the first 10 posts to summaries.
        author: post.author, // This line sets the author.
        content: post.content, // This line sets the content.
        time: post.createdAt?.toDate?.() || new Date(), // This line sets the time.
        likes: post.likes || 0, // This line sets the likes.
        comments: post.commentCount || post.comments?.length || 0, // This line sets the comments count.
        tags: post.tags || [] // This line sets the tags.
      })); // This closes the map call.
    } catch (err) { // This line starts a catch block.
      console.error('Error loading feed context:', err); // This line logs the error.
    } // This closes the catch block.

    return { // This line returns the context object.
      page: this.currentPage, // This line sets the page.
      role: this.userRole, // This line sets the role.
      userEmail, // This line sets the userEmail.
      communityName, // This line sets the communityName.
      aiInstructions: config.instructions, // This line sets the aiInstructions.
      news: config.news, // This line sets the news.
      // Grounding data for better AI responses
      stats: communityMetrics, // Includes community statistics in the context.
      trending: popularPosts, // Includes popular posts in the context.
      members: activeAuthors, // Includes active authors in the context.
      feedPosts // This line sets the feedPosts.
    }; // This closes the return object.
  } // This closes the buildContext method.

  private scrollToBottom(): void { // This line defines the private scrollToBottom method, which scrolls the messages container to the bottom.
    try { // This line starts a try block.
      this.messagesContainer.nativeElement.scrollTop = // This line sets the scrollTop to the scrollHeight.
        this.messagesContainer.nativeElement.scrollHeight; // This line gets the scrollHeight.
    } catch { } // This line catches any errors silently.
  } // This closes the scrollToBottom method.
} // This closes the AiAssistantComponent class.
