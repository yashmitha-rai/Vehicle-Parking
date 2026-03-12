import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Printer, Car, MapPin, Clock, DollarSign, User, Phone, Mail, Shield, Calendar, Timer, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ParkingTicket = ({ session, onClose }) => {
  const ticketRef = useRef(null);

  if (!session) return null;

  // Generate QR Data with ALL details (works offline)
  const generateQRData = () => {
    return JSON.stringify({
      token: session.tokenId,
      vehicle: session.vehicleNumber,
      slot: session.slotId?.slotNumber,
      section: session.slotId?.section,
      entry: session.entryTime,
      duration: session.allottedDuration,
      amount: session.totalAmount,
      gate: session.slotId?.entryGate,
      user: session.userName,
      type: session.vehicleType,
      emergency: session.isEmergencyVehicle,
      version: '1.0'
    });
  };

  // Download as Image (PNG)
  const downloadAsImage = async () => {
    try {
      const element = ticketRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `parking-ticket-${session.tokenId}.png`;
      link.click();
      
      toast.success('✅ Ticket downloaded as image!');
    } catch (error) {
      console.error('Download Error:', error);
      toast.error('Failed to download ticket');
    }
  };

  // Download as PDF
  const downloadAsPDF = async () => {
    try {
      const element = ticketRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`parking-ticket-${session.tokenId}.pdf`);
      
      toast.success('✅ Ticket downloaded as PDF!');
    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  // Print Ticket
  const handlePrint = () => {
    window.print();
    toast.success('Opening print dialog...');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8"
      >
        {/* Action Buttons */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between border-b-4 border-blue-700 z-10 rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-black text-white">Parking Ticket</h2>
            <p className="text-blue-100 text-sm font-semibold">Save or print your ticket</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadAsImage}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl text-white backdrop-blur-sm border border-white/30 transition-all"
              title="Download as Image"
            >
              <Download className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadAsPDF}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl text-white backdrop-blur-sm border border-white/30 transition-all"
              title="Download as PDF"
            >
              <Download className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl text-white backdrop-blur-sm border border-white/30 transition-all"
              title="Print Ticket"
            >
              <Printer className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-white backdrop-blur-sm border border-red-400/30 transition-all"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Ticket Design */}
        <div ref={ticketRef} className="p-8 bg-white">
          {/* Header */}
          <div className="text-center mb-6 pb-6 border-b-4 border-dashed border-gray-300">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Car className="w-9 h-9 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">SmartPark</h1>
                <p className="text-sm text-gray-600 font-semibold">Intelligent Parking System</p>
              </div>
            </div>
            <p className="text-lg font-bold text-gray-700">PARKING TICKET</p>
            <p className="text-sm text-gray-500 font-semibold">
              {format(new Date(session.entryTime), 'EEEE, MMMM dd, yyyy • hh:mm a')}
            </p>
          </div>

          {/* QR Code Section */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 border-4 border-blue-200 shadow-lg">
              <div className="bg-white p-4 rounded-2xl border-4 border-blue-500 shadow-md">
                <QRCodeSVG
                  value={generateQRData()}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Token ID</p>
                <p className="text-xl font-black text-gray-900 tracking-wider font-mono">{session.tokenId}</p>
              </div>
            </div>
          </div>

          {/* Emergency Badge */}
          {session.isEmergencyVehicle && (
            <div className="mb-6 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-center gap-3 text-white">
                <Shield className="w-8 h-8 animate-pulse" />
                <div className="text-center">
                  <p className="text-2xl font-black">EMERGENCY VEHICLE</p>
                  <p className="text-sm font-semibold opacity-90">FREE PARKING - NO CHARGES</p>
                </div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Vehicle Info */}
            <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Car className="w-5 h-5 text-blue-600" />
                <p className="text-xs font-bold text-gray-500 uppercase">Vehicle</p>
              </div>
              <p className="text-2xl font-black text-gray-900 font-mono tracking-wider">{session.vehicleNumber}</p>
              <p className="text-sm text-gray-600 font-semibold mt-1">{session.vehicleType}</p>
            </div>

            {/* Slot Info */}
            <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <p className="text-xs font-bold text-gray-500 uppercase">Parking Slot</p>
              </div>
              <p className="text-2xl font-black text-gray-900">{session.slotId?.slotNumber}</p>
              <p className="text-sm text-gray-600 font-semibold mt-1">Section {session.slotId?.section}</p>
            </div>

            {/* Entry Time */}
            <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <p className="text-xs font-bold text-gray-500 uppercase">Entry Time</p>
              </div>
              <p className="text-lg font-black text-gray-900">
                {format(new Date(session.entryTime), 'hh:mm a')}
              </p>
              <p className="text-sm text-gray-600 font-semibold mt-1">
                {format(new Date(session.entryTime), 'MMM dd, yyyy')}
              </p>
            </div>

            {/* Duration */}
            <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="w-5 h-5 text-blue-600" />
                <p className="text-xs font-bold text-gray-500 uppercase">Duration</p>
              </div>
              <p className="text-lg font-black text-gray-900">{session.allottedDuration} min</p>
              <p className="text-sm text-gray-600 font-semibold mt-1">
                Valid until {format(new Date(new Date(session.entryTime).getTime() + session.allottedDuration * 60000), 'hh:mm a')}
              </p>
            </div>

            {/* Gate */}
            <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <p className="text-xs font-bold text-gray-500 uppercase">Entry Gate</p>
              </div>
              <p className="text-lg font-black text-gray-900">{session.slotId?.entryGate}</p>
              <p className="text-sm text-gray-600 font-semibold mt-1">Use same gate for exit</p>
            </div>

            {/* Amount */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-300">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <p className="text-xs font-bold text-green-700 uppercase">Amount</p>
              </div>
              <p className="text-2xl font-black text-green-700">
                {session.isEmergencyVehicle ? 'FREE' : `₹${session.totalAmount}`}
              </p>
              <p className="text-sm text-green-600 font-semibold mt-1">
                {session.isEmergencyVehicle ? 'No charges' : `₹${session.baseRate || 20}/hour`}
              </p>
            </div>
          </div>

          {/* User Details */}
          <div className="bg-blue-50 rounded-2xl p-5 border-2 border-blue-200 mb-6">
            <p className="text-xs font-bold text-blue-600 uppercase mb-3">Contact Information</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-gray-500 font-semibold">Name</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{session.userName}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-gray-500 font-semibold">Phone</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{session.userContact}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-gray-500 font-semibold">Email</p>
                </div>
                <p className="text-sm font-bold text-gray-900 truncate">{session.userEmail}</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4">
            <p className="text-sm font-bold text-yellow-900 mb-2">📋 Important Instructions:</p>
            <ul className="space-y-1 text-xs text-yellow-800 font-semibold">
              <li>• Keep this ticket safe during your parking duration</li>
              <li>• Scan QR code at exit gate for quick checkout</li>
              <li>• Overtime charges: 50% extra per hour after allotted time</li>
              <li>• Lost ticket? Use Token ID to retrieve details</li>
              <li>• Contact support: +91 98765 43210</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t-4 border-dashed border-gray-300 text-center">
            <p className="text-xs text-gray-500 font-semibold">
              Generated on {format(new Date(), 'MMMM dd, yyyy • hh:mm:ss a')}
            </p>
            <p className="text-xs text-gray-400 font-semibold mt-1">
              SmartPark © 2025 • Powered by Intelligent Parking Solutions
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ParkingTicket;
