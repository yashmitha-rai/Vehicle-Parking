import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  User,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

const AdminContactPage = () => {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
    unread: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_BASE_URL = 'http://localhost:8008/api';

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/contacts/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch contacts
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/contacts`, {
        params: {
          status: filterStatus || undefined,
          page: currentPage,
          limit: 10
        }
      });

      if (response.data.success) {
        setContacts(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  // View contact details
  const viewContactDetails = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/contacts/${id}`);
      if (response.data.success) {
        setSelectedContact(response.data.data);
        setShowDetailModal(true);
        fetchStats(); // Refresh stats after viewing (marks as read)
      }
    } catch (error) {
      console.error('Error fetching contact details:', error);
      toast.error('Failed to load contact details');
    }
  };

  // Update contact status
  const updateStatus = async (id, status) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/contacts/${id}`, {
        status,
        isRead: true
      });

      if (response.data.success) {
        toast.success('Status updated successfully');
        fetchContacts();
        fetchStats();
        if (selectedContact?._id === id) {
          setSelectedContact(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Delete contact
  const deleteContact = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/contacts/${id}`);
      if (response.data.success) {
        toast.success('Contact deleted successfully');
        setShowDetailModal(false);
        fetchContacts();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Subject', 'Status', 'Date'],
      ...contacts.map(contact => [
        contact.name,
        contact.email,
        contact.phone,
        contact.subject,
        contact.status,
        new Date(contact.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Contacts exported successfully');
  };

  useEffect(() => {
    fetchStats();
    fetchContacts();
  }, [currentPage, filterStatus]);

  // Filter contacts by search term
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-1">Contact Management</h1>
              <p className="text-neutral-600">Manage and respond to customer inquiries</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  fetchContacts();
                  fetchStats();
                }}
                className="px-4 py-2 bg-white border-2 border-neutral-200 text-neutral-700 rounded-lg hover:border-neutral-300 transition-all flex items-center gap-2 font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToCSV}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-all flex items-center gap-2 font-medium shadow-lg"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[
            {
              label: 'Total Contacts',
              value: stats.total,
              icon: Users,
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-600'
            },
            {
              label: 'New',
              value: stats.new,
              icon: AlertCircle,
              color: 'from-green-500 to-green-600',
              bgColor: 'bg-green-50',
              textColor: 'text-green-600'
            },
            {
              label: 'In Progress',
              value: stats.inProgress,
              icon: Clock,
              color: 'from-yellow-500 to-yellow-600',
              bgColor: 'bg-yellow-50',
              textColor: 'text-yellow-600'
            },
            {
              label: 'Resolved',
              value: stats.resolved,
              icon: CheckCircle,
              color: 'from-purple-500 to-purple-600',
              bgColor: 'bg-purple-50',
              textColor: 'text-purple-600'
            },
            {
              label: 'Unread',
              value: stats.unread,
              icon: Mail,
              color: 'from-red-500 to-red-600',
              bgColor: 'bg-red-50',
              textColor: 'text-red-600'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-neutral-400" />
              </div>
              <h3 className="text-3xl font-bold text-neutral-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-neutral-600 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-6 shadow-sm">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all appearance-none bg-white"
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600 font-medium">
                Showing {filteredContacts.length} of {stats.total} contacts
              </span>
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <RefreshCw className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-neutral-500">
              <MessageSquare className="w-16 h-16 mb-4 text-neutral-300" />
              <p className="text-lg font-medium">No contacts found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredContacts.map((contact, index) => (
                      <motion.tr
                        key={contact._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-neutral-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                              {contact.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900 flex items-center gap-2">
                                {contact.name}
                                {!contact.isRead && (
                                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                              </p>
                              <p className="text-sm text-neutral-600">{contact.email}</p>
                              <p className="text-sm text-neutral-500">{contact.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800">
                            {contact.subject}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={contact.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(contact.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => viewContactDetails(contact._id)}
                              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteContact(contact._id)}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-neutral-200 px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-neutral-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedContact && (
          <ContactDetailModal
            contact={selectedContact}
            onClose={() => setShowDetailModal(false)}
            onUpdateStatus={updateStatus}
            onDelete={deleteContact}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    new: { color: 'bg-green-100 text-green-800', icon: AlertCircle, label: 'New' },
    'in-progress': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'In Progress' },
    resolved: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, label: 'Resolved' },
    closed: { color: 'bg-neutral-100 text-neutral-800', icon: XCircle, label: 'Closed' }
  };

  const config = statusConfig[status] || statusConfig.new;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

// Contact Detail Modal Component
const ContactDetailModal = ({ contact, onClose, onUpdateStatus, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl font-bold border border-white/20">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{contact.name}</h2>
                <p className="text-neutral-300 text-sm">Contact Details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <Mail className="w-5 h-5 text-neutral-600 mt-0.5" />
              <div>
                <p className="text-xs text-neutral-600 font-semibold uppercase mb-1">Email</p>
                <a href={`mailto:${contact.email}`} className="text-neutral-900 font-medium hover:text-blue-600">
                  {contact.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <Phone className="w-5 h-5 text-neutral-600 mt-0.5" />
              <div>
                <p className="text-xs text-neutral-600 font-semibold uppercase mb-1">Phone</p>
                <a href={`tel:${contact.phone}`} className="text-neutral-900 font-medium hover:text-blue-600">
                  {contact.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <FileText className="w-5 h-5 text-neutral-600 mt-0.5" />
              <div>
                <p className="text-xs text-neutral-600 font-semibold uppercase mb-1">Subject</p>
                <p className="text-neutral-900 font-medium capitalize">{contact.subject}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <Calendar className="w-5 h-5 text-neutral-600 mt-0.5" />
              <div>
                <p className="text-xs text-neutral-600 font-semibold uppercase mb-1">Date</p>
                <p className="text-neutral-900 font-medium">
                  {new Date(contact.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-3 uppercase">Message</label>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
              <p className="text-neutral-800 leading-relaxed whitespace-pre-wrap">{contact.message}</p>
            </div>
          </div>

          {/* Status Update */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-3 uppercase">Update Status</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['new', 'in-progress', 'resolved', 'closed'].map((status) => (
                <motion.button
                  key={status}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onUpdateStatus(contact._id, status)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all border-2 ${
                    contact.status === status
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900'
                  }`}
                >
                  {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = `mailto:${contact.email}`}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Send Email
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onDelete(contact._id)}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminContactPage;
