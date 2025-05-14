import { type EmailAttachment } from './email';

/**
 * Interface for email preview records
 */
export interface EmailPreview {
  id: string;
  to: string;
  from: string;
  subject: string;
  html: string;
  attachments: EmailAttachment[];
  createdAt: Date;
  sent: boolean;
}

/**
 * In-memory storage for development email previews
 * Only used in development environment
 */
class EmailPreviewStore {
  private emails: Map<string, EmailPreview> = new Map();
  private maxEntries: number = 50; // Limit the number of stored emails

  /**
   * Store a new email preview
   */
  storeEmail(email: Omit<EmailPreview, 'id' | 'createdAt'>): EmailPreview {
    const id = `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const createdAt = new Date();
    
    const emailPreview: EmailPreview = {
      ...email,
      id,
      createdAt
    };
    
    // Store the email
    this.emails.set(id, emailPreview);
    
    // Limit the number of stored emails
    if (this.emails.size > this.maxEntries) {
      // Find oldest email
      let oldestId: string | null = null;
      let oldestDate: Date | null = null;
      
      for (const [id, email] of this.emails.entries()) {
        if (!oldestDate || email.createdAt < oldestDate) {
          oldestId = id;
          oldestDate = email.createdAt;
        }
      }
      
      // Remove oldest email
      if (oldestId) {
        this.emails.delete(oldestId);
      }
    }
    
    return emailPreview;
  }
  
  /**
   * Get all stored emails
   */
  getAllEmails(): EmailPreview[] {
    return Array.from(this.emails.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
  }
  
  /**
   * Get a specific email by ID
   */
  getEmailById(id: string): EmailPreview | undefined {
    return this.emails.get(id);
  }
  
  /**
   * Mark an email as sent
   */
  markAsSent(id: string): boolean {
    const email = this.emails.get(id);
    if (email) {
      email.sent = true;
      this.emails.set(id, email);
      return true;
    }
    return false;
  }
  
  /**
   * Clear all stored emails
   */
  clearAllEmails(): void {
    this.emails.clear();
  }
}

// Singleton instance for the application
export const emailPreviewStore = new EmailPreviewStore();

export default emailPreviewStore; 