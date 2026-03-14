import { render, screen, fireEvent } from '@testing-library/react';
import DashboardView from './components/DashboardView';
import React from 'react';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
};

describe('Dashboard Core Launch', () => {
  it('renders the main forensic intercept title', async () => {
    render(<DashboardView />);

    // 1. If Intercept_Stream::Live is in a different tab, click it:
    const streamTab = screen.getByText(/Integrity Stream/i);
    fireEvent.click(streamTab);

    // 2. Use findByText (async) instead of getByText (sync)
    const titleElement = await screen.findByText(/Intercept_Stream::Live/i);
    expect(titleElement).toBeInTheDocument();
  });
});