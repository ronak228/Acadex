import apiClient from './apiClient';

const authService = {
  // Login
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Store the full user object returned by login (includes mustChangePassword etc.)
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Get current user profile from server and refresh localStorage
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.error('Logout request failed', e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Change password — refreshes localStorage so mustChangePassword clears immediately
  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    try {
      const fresh = await apiClient.get('/auth/me');
      if (fresh.data) localStorage.setItem('user', JSON.stringify(fresh.data));
    } catch (_) {}
    return response.data;
  },

  // Update name/phone; refreshes localStorage
  updateProfile: async (data) => {
    const response = await apiClient.patch('/auth/me', data);
    if (response.data) localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  // Check if user is logged in locally
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get local user details
  getLocalUser: () => {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  }
};

export default authService;
