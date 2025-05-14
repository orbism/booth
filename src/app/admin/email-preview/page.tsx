'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle, RefreshCw, Send, Trash2 } from 'lucide-react';

// Email preview interface
interface EmailPreview {
  id: string;
  to: string;
  from: string;
  subject: string;
  html: string;
  attachments: Array<{
    filename: string;
    path?: string;
    contentType?: string;
  }>;
  createdAt: string;
  sent: boolean;
}

export default function EmailPreviewPage() {
  const router = useRouter();
  const [emails, setEmails] = useState<EmailPreview[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'details'>('preview');

  // Load emails on mount and when refreshKey changes
  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/dev/emails');
        const data = await response.json();
        
        if (data.emails) {
          // Convert dates from strings to Date objects
          const formattedEmails = data.emails.map((email: any) => ({
            ...email,
            createdAt: new Date(email.createdAt).toLocaleString(),
          }));
          
          setEmails(formattedEmails);
          setEmailEnabled(data.emailEnabledInDev);
        }
      } catch (error) {
        console.error('Failed to load emails:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [refreshKey]);

  // Handle email selection
  const handleSelectEmail = (email: EmailPreview) => {
    setSelectedEmail(email);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle clear all emails
  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all email previews?')) {
      return;
    }
    
    try {
      await fetch('/api/dev/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear' }),
      });
      
      // Refresh the list
      handleRefresh();
    } catch (error) {
      console.error('Failed to clear emails:', error);
    }
  };

  // Handle send email
  const handleSendEmail = async (id: string) => {
    try {
      await fetch('/api/dev/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'send', id }),
      });
      
      // Refresh the list
      handleRefresh();
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Email Preview</h1>
          <p className="text-gray-500">
            Preview emails sent in development mode
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Email Sending:</span>
            {emailEnabled ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Enabled
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                Disabled
              </span>
            )}
          </div>
          <button 
            onClick={handleRefresh} 
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button 
            onClick={handleClearAll} 
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : emails.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No emails yet</h2>
            <p className="text-gray-500 mb-4">
              Emails sent during development will appear here
            </p>
            <p className="text-sm text-gray-400">
              Set EMAIL_ENABLED_IN_DEV=true in your .env to enable email sending in development
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Email List</h2>
                <p className="text-sm text-gray-500">
                  {emails.length} email{emails.length !== 1 ? 's' : ''} in preview
                </p>
              </div>
              <div className="p-4">
                <div className="h-[600px] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    {emails.map((email) => (
                      <div
                        key={email.id}
                        className={`p-3 rounded cursor-pointer transition-colors ${
                          selectedEmail?.id === email.id
                            ? 'bg-blue-50 border-l-4 border-blue-500'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handleSelectEmail(email)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium truncate max-w-[200px]">
                            {email.subject}
                          </span>
                          {email.sent ? (
                            <span className="inline-flex items-center rounded-full border border-green-500 px-2.5 py-0.5 text-xs font-medium text-green-500">
                              Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-yellow-500 px-2.5 py-0.5 text-xs font-medium text-yellow-500">
                              Preview
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          To: {email.to}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {email.createdAt}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2">
            {selectedEmail ? (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold">{selectedEmail.subject}</h2>
                      <p className="text-sm text-gray-500">
                        From: {selectedEmail.from} - To: {selectedEmail.to}
                      </p>
                    </div>
                    {!selectedEmail.sent && (
                      <button 
                        onClick={() => handleSendEmail(selectedEmail.id)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Now
                      </button>
                    )}
                  </div>
                </div>
                <div className="border-b">
                  <div className="flex">
                    <button
                      className={`px-4 py-2 text-sm font-medium ${activeTab === 'preview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveTab('preview')}
                    >
                      Preview
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium ${activeTab === 'html' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveTab('html')}
                    >
                      HTML
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActiveTab('details')}
                    >
                      Details
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {activeTab === 'preview' && (
                    <div className="border rounded-md p-4 h-[500px] overflow-auto bg-white">
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                    </div>
                  )}
                  
                  {activeTab === 'html' && (
                    <pre className="border rounded-md p-4 h-[500px] overflow-auto bg-gray-50 text-xs">
                      {selectedEmail.html}
                    </pre>
                  )}
                  
                  {activeTab === 'details' && (
                    <div className="border rounded-md p-4 h-[500px] overflow-auto">
                      <h3 className="text-lg font-medium mb-4">Email Details</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-1">Metadata</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-500">ID:</div>
                            <div>{selectedEmail.id}</div>
                            <div className="text-gray-500">Created At:</div>
                            <div>{selectedEmail.createdAt}</div>
                            <div className="text-gray-500">Status:</div>
                            <div>
                              {selectedEmail.sent ? (
                                <span className="flex items-center text-green-500">
                                  <CheckCircle className="h-4 w-4 mr-1" /> Sent
                                </span>
                              ) : (
                                <span className="flex items-center text-yellow-500">
                                  <AlertTriangle className="h-4 w-4 mr-1" /> Preview Only
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-1">Attachments ({selectedEmail.attachments.length})</h4>
                          {selectedEmail.attachments.length === 0 ? (
                            <p className="text-sm text-gray-500">No attachments</p>
                          ) : (
                            <ul className="list-disc list-inside text-sm">
                              {selectedEmail.attachments.map((attachment, index) => (
                                <li key={index} className="mb-1">
                                  {attachment.filename}
                                  {attachment.contentType && (
                                    <span className="text-xs text-gray-400 ml-2">
                                      ({attachment.contentType})
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between p-4 border-t">
                  <div className="text-xs text-gray-500">
                    ID: {selectedEmail.id}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedEmail.createdAt}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg">
                <div className="flex flex-col items-center justify-center h-[600px]">
                  <p className="text-gray-500">Select an email to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 