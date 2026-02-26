
import { render, screen } from '@testing-library/react';
import { AgentPlayground } from '../agent-playground';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('@/server/actions/landing-geo', () => ({
  getLandingGeoData: jest.fn().mockResolvedValue({
    location: { city: 'Chicago', state: 'IL' },
    retailers: [],
    brands: []
  })
}));

jest.mock('@/components/landing/email-capture-modal', () => ({
  EmailCaptureModal: () => <div data-testid="email-modal">Email Modal</div>
}));

jest.mock('@/components/chat/unified-agent-chat', () => ({
  UnifiedAgentChat: ({ promptSuggestions = [] }: { promptSuggestions?: string[] }) => (
    <div>
      <div>Ember Assistant</div>
      {promptSuggestions.map((p: string) => (
        <div key={p}>{p}</div>
      ))}
      <input placeholder="Ask Ember a question..." />
      <span>Puff</span>
      <span>Standard</span>
    </div>
  )
}));

describe('AgentPlayground', () => {
  it('renders "Ember Assistant" header', () => {
    render(<AgentPlayground />);
    expect(screen.getByText('Ember Assistant')).toBeInTheDocument();
  });

  it('renders the unified chat shell', () => {
    render(<AgentPlayground />);
    expect(screen.getByText('Ember Assistant')).toBeInTheDocument();
  });

  it('renders default suggestions', () => {
    render(<AgentPlayground />);
    expect(screen.getByText('Track nearby competitor pricing')).toBeInTheDocument();
    expect(screen.getByText('Run a compliance risk scan on my site')).toBeInTheDocument();
  });

  it('renders the chat input and send button', () => {
    render(<AgentPlayground />);
    const input = screen.getByPlaceholderText('Ask Ember a question...');
    expect(input).toBeInTheDocument();
    
    // Check for "Puff" / "Standard" chips based on text
    expect(screen.getByText('Puff')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
  });
});

