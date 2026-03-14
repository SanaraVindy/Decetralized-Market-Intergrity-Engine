import '@testing-library/jest-dom';

// 1. Fix for Recharts: Mocks the ResizeObserver which doesn't exist in JSDOM
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// 2. Fix for Lucide-React: Simplifies icons so they don't break the renderer
jest.mock('lucide-react', () => ({
    ...jest.requireActual('lucide-react'),
    // We mock icons that use complex animations or nested SVGs
    Loader2: () => <span data-testid="loader-icon" />,
    Wifi: () => <span data-testid="wifi-icon" />,
    WifiOff: () => <span data-testid="wifioff-icon" />,
    Activity: () => <span data-testid="activity-icon" />,
    Cpu: () => <span data-testid="cpu-icon" />,
    ShieldAlert: () => <span data-testid="shield-alert-icon" />,
    Database: () => <span data-testid="database-icon" />,
    Fingerprint: () => <span data-testid="fingerprint-icon" />,
    Share2: () => <span data-testid="share2-icon" />,
    ChartBarIcon: () => <span data-testid="chart-bar-icon" />,
    Zap: () => <span data-testid="zap-icon" />,
    LogOut: () => <span data-testid="logout-icon" />,
    ChevronLeft: () => <span data-testid="chevron-left-icon" />,
    ChevronRight: () => <span data-testid="chevron-right-icon" />,
    RefreshCw: () => <span data-testid="refresh-cw-icon" />,
    Search: () => <span data-testid="search-icon" />,
    ChevronDown: () => <span data-testid="chevron-down-icon" />,
    Layers: () => <span data-testid="layers-icon" />,
    Maximize2: () => <span data-testid="maximize2-icon" />,
    AlertTriangle: () => <span data-testid="alert-triangle-icon" />,
    X: () => <span data-testid="x-icon" />,
    ShieldCheck: () => <span data-testid="shield-check-icon" />,
    AlertCircle: () => <span data-testid="alert-circle-icon" />,
    Download: () => <span data-testid="download-icon" />,
    ArrowUpRight: () => <span data-testid="arrow-up-right-icon" />,
    ArrowDownLeft: () => <span data-testid="arrow-down-left-icon" />,
    CheckCircle: () => <span data-testid="check-circle-icon" />,
    Info: () => <span data-testid="info-icon" />,
    HelpCircle: () => <span data-testid="help-circle-icon" />,
    MessageSquare: () => <span data-testid="message-square-icon" />,
    Mail: () => <span data-testid="mail-icon" />,
    TrendingUp: () => <span data-testid="trending-up-icon" />,
}));

// 3. Fix for Recharts: Mocks the ResponsiveContainer to just render children
jest.mock('recharts', () => {
    const React = require('react');
    return {
        ResponsiveContainer: ({ children }) => React.createElement('div', { className: 'mock-recharts-container' }, children),
        RadarChart: ({ children }) => React.createElement('div', { 'data-testid': 'radar-chart' }, children),
        BarChart: ({ children }) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
        PolarGrid: () => React.createElement('div', { 'data-testid': 'polar-grid' }),
        PolarAngleAxis: () => React.createElement('div', { 'data-testid': 'polar-angle-axis' }),
        PolarRadiusAxis: () => React.createElement('div', { 'data-testid': 'polar-radius-axis' }),
        Radar: () => React.createElement('div', { 'data-testid': 'radar' }),
        XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
        YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
        Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
        Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
        Cell: () => React.createElement('div', { 'data-testid': 'cell' }),
    };
});

// 4. Suppress specific console.error messages
const originalConsoleError = console.error;
console.error = (...args) => {
    const message = args.join(' ');
    if (
        message.includes('not wrapped in act(') ||
        message.includes('Live Feed Interruption: Error: Unknown URL') ||
        message.includes('Connection Failed: Error: Unknown URL')
    ) {
        return; // Swallow the error
    }
    originalConsoleError.apply(console, args);
};

// 5. TEARDOWN: Ensure tests do not leak and workers close gracefully
afterEach(() => {
    // Clear any pending timers (e.g., from setTimeout or setInterval)
    jest.clearAllTimers();
    // Clear all mocks and reset implementation to default
    jest.clearAllMocks();
});