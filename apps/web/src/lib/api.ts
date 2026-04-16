// In the demo build the real backend is replaced by axios-mock-adapter.
// All components that import from '@/lib/api' will receive the mocked client.
export { apiClient } from './mock';
