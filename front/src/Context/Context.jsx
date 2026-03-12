import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();
const API_URL = 'http://localhost:8008/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const getConfig = () => {
    const currentToken = token || localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // AUTH FUNCTIONS
  const adminLogin = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/admin/login`, { email, password });
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // toast.success('Admin login successful!');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const userLogin = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Login successful!');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  };

  // ADMIN DASHBOARD
  const getDashboardStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/admin/dashboard`, getConfig());
      return { success: true, data: data.stats || data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard');
      return { success: false };
    }
  };

  // SLOT MANAGEMENT - ENHANCED
  const getAllSlots = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = params ? `${API_URL}/admin/slots?${params}` : `${API_URL}/admin/slots`;
      const { data } = await axios.get(url, getConfig());
      return { success: true, data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch slots');
      return { success: false };
    }
  };

  const generateSlots = async (slotData) => {
    try {
      const { data } = await axios.post(`${API_URL}/admin/slots/generate`, slotData, getConfig());
      toast.success(data.message);
      return { success: true, data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate slots');
      return { success: false };
    }
  };

  const bulkUpdateSlots = async (slotIds, updates) => {
    try {
      const { data } = await axios.patch(`${API_URL}/admin/slots/bulk`, { slotIds, updates }, getConfig());
      toast.success(data.message);
      return { success: true, data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bulk update failed');
      return { success: false };
    }
  };

  const setEmergencySlot = async (slotId, priority = 3) => {
    try {
      const { data } = await axios.patch(`${API_URL}/admin/slots/${slotId}/emergency`, { priority }, getConfig());
      toast.success(data.message);
      return { success: true, data: data.slot };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Emergency override failed');
      return { success: false };
    }
  };

  const clearEmergencySlot = async (slotId) => {
    try {
      const { data } = await axios.patch(`${API_URL}/admin/slots/${slotId}/emergency/clear`, {},getConfig());
      toast.success(data.message);
      return { success: true, data: data.slot };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clear emergency');
      return { success: false };
    }
  };

  const getSlotAnalytics = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/admin/slots/analytics`, getConfig());
      return { success: true, data: data.analytics };
    } catch (error) {
      return { success: false };
    }
  };

  const getGateStatus = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/admin/gates/status`, getConfig());
      return { success: true, data: data.gates };
    } catch (error) {
      return { success: false };
    }
  };

  // SLOT CRUD
  const createSlot = async (slotData) => {
    try {
      const { data } = await axios.post(`${API_URL}/admin/slots`, slotData, getConfig());
      toast.success(data.message);
      return { success: true, data: data.slot };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create slot');
      return { success: false };
    }
  };

  const updateSlot = async (id, slotData) => {
    try {
      const { data } = await axios.put(`${API_URL}/admin/slots/${id}`, slotData, getConfig());
      toast.success(data.message);
      return { success: true, data: data.slot };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update slot');
      return { success: false };
    }
  };

  const deleteSlot = async (id) => {
    try {
      const { data } = await axios.delete(`${API_URL}/admin/slots/${id}`, getConfig());
      toast.success(data.message);
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete slot');
      return { success: false };
    }
  };

  const toggleSlotStatus = async (id) => {
    try {
      const { data } = await axios.patch(`${API_URL}/admin/slots/${id}/toggle`, {}, getConfig());
      toast.success(data.message);
      return { success: true, data: data.slot };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle slot');
      return { success: false };
    }
  };

  const deleteAllSlots = async () => {
    try {
      const { data } = await axios.delete(`${API_URL}/admin/slots/all`, getConfig());
      toast.success(data.message);
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete all slots');
      return { success: false };
    }
  };

  const getAllSessions = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = params ? `${API_URL}/admin/sessions?${params}` : `${API_URL}/admin/sessions`;
      const { data } = await axios.get(url, getConfig());
      return { success: true, data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch sessions');
      return { success: false };
    }
  };

  // ============================================
  // USER-SIDE FUNCTIONS (NO AUTH REQUIRED)
  // ============================================

  // Get available slots for users
  const getUserAvailableSlots = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = params ? `${API_URL}/user/slots/available?${params}` : `${API_URL}/user/slots/available`;
      const { data } = await axios.get(url);
      return { success: true, data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch available slots');
      return { success: false };
    }
  };

  // Get slot summary (real-time stats)
  const getSlotSummary = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/user/slots/summary`);
      return { success: true, data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch summary');
      return { success: false };
    }
  };

  // Get single slot details
  const getUserSlotDetails = async (slotId) => {
    try {
      const { data } = await axios.get(`${API_URL}/user/slots/${slotId}`);
      return { success: true, data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch slot details');
      return { success: false };
    }
  };

  // Book a parking slot
  const bookParkingSlot = async (bookingData) => {
    try {
      const { data } = await axios.post(`${API_URL}/user/book`, bookingData);
      toast.success(data.message || 'Slot booked successfully!');
      return { success: true, data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
      return { success: false, message: error.response?.data?.message };
    }
  };

  // Get session by token
  const getSessionByToken = async (tokenId) => {
    try {
      const { data } = await axios.get(`${API_URL}/user/session/${tokenId}`);
      return { success: true, data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Session not found');
      return { success: false };
    }
  };

  // Extend parking session
  const extendParkingSession = async (tokenId, additionalMinutes) => {
    try {
      const { data } = await axios.patch(`${API_URL}/user/session/${tokenId}/extend`, { additionalMinutes });
      toast.success(data.message || 'Session extended successfully');
      return { success: true, data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Extension failed');
      return { success: false };
    }
  };

  // Complete parking session (exit)
  const completeParkingSession = async (tokenId, paymentMethod) => {
    try {
      const { data } = await axios.patch(`${API_URL}/user/session/${tokenId}/complete`, { paymentMethod });
      toast.success(data.message || 'Session completed successfully');
      return { success: true, data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete session');
      return { success: false };
    }
  };

  // Cancel parking session
  const cancelParkingSession = async (tokenId) => {
    try {
      const { data } = await axios.patch(`${API_URL}/user/session/${tokenId}/cancel`);
      toast.success(data.message || 'Booking cancelled successfully');
      return { success: true, data };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cancellation failed');
      return { success: false };
    }
  };

  // Get pricing information
  const getPricingInfo = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/user/pricing`);
      return { success: true, data };
    } catch (error) {
      return { success: false };
    }
  };

  const getAllSessionsDetailed = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const url = params ? `${API_URL}/admin/sessions/detailed?${params}` : `${API_URL}/admin/sessions/detailed`;
    const { data } = await axios.get(url, getConfig());
    return { success: true, data };
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to fetch sessions');
    return { success: false };
  }
};

const getActiveSessions = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/admin/sessions/active`, getConfig());
    return { success: true, data };
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to fetch active sessions');
    return { success: false };
  }
};

const getSessionDetails = async (sessionId) => {
  try {
    const { data } = await axios.get(`${API_URL}/admin/sessions/${sessionId}`, getConfig());
    return { success: true, data };
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to fetch session details');
    return { success: false };
  }
};

const getPaymentAnalytics = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const url = params ? `${API_URL}/admin/sessions/payments?${params}` : `${API_URL}/admin/sessions/payments`;
    const { data } = await axios.get(url, getConfig());
    return { success: true, data };
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to fetch payment analytics');
    return { success: false };
  }
};

const getSessionAnalytics = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/admin/sessions/analytics`, getConfig());
    return { success: true, data };
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to fetch session analytics');
    return { success: false };
  }
};

const forceCompleteSession = async (sessionId, reason, paymentMethod) => {
  try {
    const { data } = await axios.patch(
      `${API_URL}/admin/sessions/${sessionId}/force-complete`,
      { reason, paymentMethod },
      getConfig()
    );
    toast.success(data.message);
    return { success: true, data };
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to complete session');
    return { success: false };
  }
};

const updatePaymentStatus = async (sessionId, paymentStatus, paymentMethod) => {
  try {
    const { data } = await axios.patch(
      `${API_URL}/admin/sessions/${sessionId}/payment`,
      { paymentStatus, paymentMethod },
      getConfig()
    );
    toast.success(data.message);
    return { success: true, data };
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to update payment');
    return { success: false };
  }
};

const getSessionsByVehicle = async (vehicleNumber) => {
  try {
    const { data } = await axios.get(`${API_URL}/admin/sessions/vehicle/${vehicleNumber}`, getConfig());
    return { success: true, data };
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to fetch vehicle sessions');
    return { success: false };
  }
};

const bulkDeleteSessions = async (olderThan) => {
  try {
    const { data } = await axios.delete(`${API_URL}/admin/sessions/bulk-delete?olderThan=${olderThan}`, getConfig());
    toast.success(data.message);
    return { success: true, data };
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to delete sessions');
    return { success: false };
  }
};

  const value = {
    user, token, loading,
    adminLogin, userLogin, logout,
    
    // Dashboard & Analytics
    getDashboardStats,
    getSlotAnalytics,
    getGateStatus,
    
    // Slot Management
    getAllSlots,
    createSlot,
    updateSlot,
    deleteSlot,
    generateSlots,
    bulkUpdateSlots,
    toggleSlotStatus,
    deleteAllSlots,
    
    // Emergency Control
    setEmergencySlot,
    clearEmergencySlot,
    
    // Sessions
    getAllSessions,

     // User Functions (No Auth)
    getUserAvailableSlots,
    getSlotSummary,
    getUserSlotDetails,
    bookParkingSlot,
    getSessionByToken,
    extendParkingSession,
    completeParkingSession,
    cancelParkingSession,
    getPricingInfo,
      getAllSessionsDetailed,
  getActiveSessions,
  getSessionDetails,
  getPaymentAnalytics,
  getSessionAnalytics,
  forceCompleteSession,
  updatePaymentStatus,
  getSessionsByVehicle,
  bulkDeleteSessions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
