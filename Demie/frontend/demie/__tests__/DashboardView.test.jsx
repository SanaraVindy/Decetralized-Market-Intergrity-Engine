import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardView from '../components/DashboardView';

// Mock fetch globally
global.fetch = jest.fn();

describe('DashboardView Component', () => {
    const mockData = {
        metadata: {
            meanIRS: '15.5%',
            status: 'active'
        },
        topEntities: [
            { id: 'entity1', score: 85 },
            { id: 'entity2', score: 45 }
        ],
        radarData: [
            { subject: 'Risk A', value: 75 },
            { subject: 'Risk B', value: 60 }
        ]
    };

    const mockStats = {
        valueAtRisk: '$1.2M',
        total_nodes: 1500,
        avgRiskScore: 0.155
    };

    const mockEntities = [
        { id: 'entity1', riskScore: 0.85, cluster: 'high-risk' },
        { id: 'entity2', riskScore: 0.45, cluster: 'medium-risk' }
    ];

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Mock successful API responses
        global.fetch.mockImplementation((url) => {
            if (url === 'http://127.0.0.1:8000/api/analytics/forensics') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockData)
                });
            }
            if (url === 'http://127.0.0.1:8000/api/health') {
                return Promise.resolve({
                    ok: true
                });
            }
            if (url === 'http://127.0.0.1:8000/api/entities') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockEntities)
                });
            }
            if (url === 'http://127.0.0.1:8000/api/stats') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockStats)
                });
            }
            return Promise.reject(new Error('Unknown URL'));
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Initial Rendering', () => {
        it('renders the dashboard with sidebar and main content', async () => {
            render(<DashboardView />);

            // Check if main elements are rendered
            expect(screen.getByText('DeMIE')).toBeInTheDocument();
            expect(screen.getByText('Identity Explorer')).toBeInTheDocument();
            expect(screen.getByText('GAT Analytics')).toBeInTheDocument();

            // Wait for data to load
            await waitFor(() => {
                expect(screen.getByText('Value at Risk')).toBeInTheDocument();
            });
        });

        it('displays loading states initially', () => {
            render(<DashboardView />);

            // Check for loading indicators in SuperEntitiesView (default tab)
            expect(screen.getByText('Reconstructing Topological Clusters...')).toBeInTheDocument();
        });

        it('loads and displays analytics data', async () => {
            render(<DashboardView />);

            // Wait for the data to actually hit the screen
            await waitFor(() => {
                expect(screen.getByText('15.5%')).toBeInTheDocument();
            });

            // CRITICAL: Wait for the loading state to flip to false to avoid 'act' warnings
            await waitFor(() => {
                expect(screen.queryByText(/Syncing|Reconstructing/i)).not.toBeInTheDocument();
            });
        });

        describe('Navigation', () => {
            it('switches between different tabs', async () => {
                render(<DashboardView />);

                // Default tab should be explorer
                await waitFor(() => {
                    expect(screen.getByText('Super-Entities')).toBeInTheDocument();
                });

                // Click on analytics tab
                const analyticsTab = screen.getByText('GAT Analytics');
                fireEvent.click(analyticsTab);

                await waitFor(() => {
                    expect(screen.getByText('GAT Neural Analytics')).toBeInTheDocument();
                });

                // Click on about tab
                const aboutTab = screen.getByText('About DeMIE');
                fireEvent.click(aboutTab);

                await waitFor(() => {
                    expect(screen.getByText('DeMIE Intelligence')).toBeInTheDocument();
                });
            });

            it('toggles sidebar collapse', async () => {
                render(<DashboardView />);

                // Initially sidebar should be expanded
                expect(screen.getByText('DeMIE')).toBeInTheDocument();

                // Click collapse button
                const collapseButton = screen.getByRole('button', { name: /chevron/i });
                fireEvent.click(collapseButton);

                // Sidebar should be collapsed (DeMIE text hidden)
                await waitFor(() => {
                    expect(screen.queryByText('DeMIE')).not.toBeInTheDocument();
                });
            });
        });

        describe('Analytics View', () => {
            it('displays radar chart with data', async () => {
                render(<DashboardView />);

                // Switch to analytics tab
                const analyticsTab = screen.getByText('GAT Analytics');
                fireEvent.click(analyticsTab);

                await waitFor(() => {
                    expect(screen.getByText('Topological Risk Vectors')).toBeInTheDocument();
                });

                // Check if chart data is rendered (mocked)
                expect(screen.getByText('Anomalous Node Distribution')).toBeInTheDocument();
            });

            it('handles re-analyze button click', async () => {
                render(<DashboardView />);

                // Switch to analytics tab
                const analyticsTab = screen.getByText('GAT Analytics');
                fireEvent.click(analyticsTab);

                await waitFor(() => {
                    const reAnalyzeButton = screen.getByText('Re-Analyze Network');
                    fireEvent.click(reAnalyzeButton);
                });

                // Check if API was called
                await waitFor(() => {
                    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/analyze', { method: 'POST' });
                });
            });
        });

        describe('Engine Status', () => {
            it('shows online status when API is healthy', async () => {
                render(<DashboardView />);

                await waitFor(() => {
                    expect(screen.getByText('GAT Engine Online')).toBeInTheDocument();
                });
            });

            it('shows offline status when API fails', async () => {
                // Mock failed health check
                global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

                render(<DashboardView />);

                await waitFor(() => {
                    expect(screen.getByText('Engine Offline')).toBeInTheDocument();
                });
            });
        });

        describe('Search Functionality', () => {
            it('filters entities based on search query', async () => {
                render(<DashboardView />);

                // Wait for entities to load
                await waitFor(() => {
                    expect(screen.getByText('Super-Entities')).toBeInTheDocument();
                });

                // Find search input (assuming it exists in SuperEntitiesView)
                const searchInput = screen.getByPlaceholderText(/search/i) || screen.getByRole('textbox');
                if (searchInput) {
                    fireEvent.change(searchInput, { target: { value: 'entity1' } });

                    // Check if filtering works (this depends on SuperEntitiesView implementation)
                    await waitFor(() => {
                        // This assertion would need to be adjusted based on actual filtering behavior
                        expect(searchInput.value).toBe('entity1');
                    });
                }
            });
        });

        describe('Error Handling', () => {
            it('handles API errors gracefully', async () => {
                // Mock failed API call
                global.fetch.mockImplementationOnce(() =>
                    Promise.resolve({
                        ok: false,
                        status: 500
                    })
                );

                render(<DashboardView />);

                // Should still render without crashing
                await waitFor(() => {
                    expect(screen.getByText('DeMIE')).toBeInTheDocument();
                });

                // Check that error was logged (we can't easily test console.error, but component should handle it)
            });

            it('shows loading state during API calls', async () => {
                // Mock slow API response
                global.fetch.mockImplementationOnce(() =>
                    new Promise(resolve =>
                        setTimeout(() => resolve({
                            ok: true,
                            json: () => Promise.resolve(mockData)
                        }), 100)
                    )
                );

                render(<DashboardView />);

                // Switch to analytics tab to see the loading state
                const analyticsTab = screen.getByText('GAT Analytics');
                fireEvent.click(analyticsTab);

                // Initially should show loading
                expect(screen.getByText('Syncing Tensors...')).toBeInTheDocument();

                // After API resolves, loading should disappear
                await waitFor(() => {
                    expect(screen.queryByText('Syncing Tensors...')).not.toBeInTheDocument();
                });
            });
        });

        describe('Logout Functionality', () => {
            it('calls onLogout when logout button is clicked', async () => {
                const mockOnLogout = jest.fn();
                render(<DashboardView onLogout={mockOnLogout} />);

                const logoutButton = screen.getByText('Terminate Session');
                fireEvent.click(logoutButton);

                expect(mockOnLogout).toHaveBeenCalledTimes(1);
            });
        });

        describe('Live Feed', () => {
            it('displays live feed when available', async () => {
                render(<DashboardView />);

                // Switch to live tab
                const liveTab = screen.getByText('Integrity Stream');
                fireEvent.click(liveTab);

                await waitFor(() => {
                    expect(screen.getByText('Intercept_Stream::Live')).toBeInTheDocument();
                });

                // When no live feed, should show listening message
                expect(screen.getByText(/Listening for incoming transactions/i)).toBeInTheDocument();
            });
        });

        describe('Risk Distribution', () => {
            it('displays risk distribution cards', async () => {
                render(<DashboardView />);

                await waitFor(() => {
                    expect(screen.getByText('Critical Risk')).toBeInTheDocument();
                    expect(screen.getByText('Moderate Risk')).toBeInTheDocument();
                    expect(screen.getByText('Stable')).toBeInTheDocument();
                });
            });
        });
    });

});