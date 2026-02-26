// src/app/dashboard/playbooks/components/playbooks-header.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlaybooksHeader, PlaybookFilterCategory } from '@/app/dashboard/playbooks/components/playbooks-header';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="icon-search" className="text-blue-400" />,
  Plus: () => <div data-testid="icon-plus" className="text-blue-400" />,
}));

describe('PlaybooksHeader', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: jest.fn(),
    activeFilter: 'All' as PlaybookFilterCategory,
    onFilterChange: jest.fn(),
    onNewPlaybook: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering (Dark Theme)', () => {
    it('renders the title in blue', () => {
      render(<PlaybooksHeader {...defaultProps} />);
      const title = screen.getByText('Playbooks');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-blue-400'); // assuming title uses blue in component
    });

    it('renders the subtitle in light gray', () => {
      render(<PlaybooksHeader {...defaultProps} />);
      expect(screen.getByText('Automation recipes for your brand.')).toHaveClass('text-zinc-300');
    });

    it('renders search input with dark background', () => {
      render(<PlaybooksHeader {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500');
    });

    it('renders New Playbook button with blue accent', () => {
      render(<PlaybooksHeader {...defaultProps} />);
      const button = screen.getByText('New Playbook');
      expect(button).toBeInTheDocument();
      expect(button.closest('button')).toHaveClass('bg-blue-600 hover:bg-blue-500 text-white');
    });

    it('renders all filter tabs in dark style', () => {
      render(<PlaybooksHeader {...defaultProps} />);
      const filters = ['All', 'Intel', 'SEO', 'Ops', 'Finance', 'Compliance'];
      filters.forEach((filter) => {
        const tab = screen.getByText(filter);
        expect(tab).toBeInTheDocument();
        expect(tab.closest('button')).toHaveClass('text-zinc-300 hover:text-white hover:bg-zinc-900');
      });
    });
  });

  describe('Search Functionality (Dark Theme)', () => {
    it('displays the current search query in white text', () => {
      render(<PlaybooksHeader {...defaultProps} searchQuery="intel" />);
      const input = screen.getByPlaceholderText('Search') as HTMLInputElement;
      expect(input.value).toBe('intel');
      expect(input).toHaveClass('text-white');
    });

    it('calls onSearchChange when typing', () => {
      render(<PlaybooksHeader {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search');
      fireEvent.change(input, { target: { value: 'test query' } });
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('test query');
    });
  });

  describe('Filter Tabs (Dark Theme)', () => {
    it('highlights the active filter with blue background', () => {
      render(<PlaybooksHeader {...defaultProps} activeFilter="Intel" />);
      const intelButton = screen.getByText('Intel');
      expect(intelButton).toHaveClass('bg-blue-950/60 text-blue-300');
    });

    it('calls onFilterChange when filter is clicked', () => {
      render(<PlaybooksHeader {...defaultProps} />);
      fireEvent.click(screen.getByText('SEO'));
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith('SEO');
    });

    it('changes active filter correctly with blue highlight', () => {
      const { rerender } = render(<PlaybooksHeader {...defaultProps} />);

      // Initially All is active
      expect(screen.getByText('All')).toHaveClass('bg-blue-950/60 text-blue-300');

      // Click Finance
      fireEvent.click(screen.getByText('Finance'));
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith('Finance');

      // Rerender with new active filter
      rerender(<PlaybooksHeader {...defaultProps} activeFilter="Finance" />);
      expect(screen.getByText('Finance')).toHaveClass('bg-blue-950/60 text-blue-300');
    });
  });

  describe('New Playbook Button (Dark Theme)', () => {
    it('calls onNewPlaybook when clicked', () => {
      render(<PlaybooksHeader {...defaultProps} />);
      fireEvent.click(screen.getByText('New Playbook'));
      expect(defaultProps.onNewPlaybook).toHaveBeenCalled();
    });

    it('has blue hover effect', () => {
      render(<PlaybooksHeader {...defaultProps} />);
      const button = screen.getByText('New Playbook').closest('button');
      expect(button).toHaveClass('hover:bg-blue-700');
    });
  });
});